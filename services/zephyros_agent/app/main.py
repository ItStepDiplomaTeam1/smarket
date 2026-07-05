import json
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel, ValidationError
from pydantic_ai.exceptions import ModelHTTPError
import pydantic_ai.messages as pydantic_ai_msgs

from app.agent.zephyros import agent, available_provider_chain, build_model
from app.config import settings
from app.deps import AgentDeps
from app.logging import setup_logging
from app.schemas import ZephyrosResponse

setup_logging(level=settings.LOG_LEVEL, json_logs=settings.LOG_JSON)

_provider_down_until: dict[str, float] = {}


def _truncate(value: str | None, limit: int = 240) -> str:
    if not value:
        return ""
    return value if len(value) <= limit else f"{value[:limit]}..."


def _mark_down(provider: str, seconds: float) -> None:
    _provider_down_until[provider] = time.monotonic() + seconds
    logger.bind(provider=provider, cooldown_seconds=seconds).warning(
        "Provider moved to cooldown",
    )


def _is_down(provider: str) -> bool:
    until = _provider_down_until.get(provider)
    # TODO: If SMARKET_AGENT_WORKERS is ever set to > 1, this in-memory structure
    # must be moved to a shared Redis store. For single worker process, in-memory is sufficient.
    return until is not None and time.monotonic() < until


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        timeout=30.0,
    )
    logger.info("Zephyros agent service started")
    try:
        chain = available_provider_chain()
        logger.bind(provider_candidates=chain).info("Resolved available provider candidates")
    except Exception:
        logger.exception("Error checking available providers on startup")
    yield
    await app.state.http_client.aclose()
    logger.info("Zephyros agent service stopped")


app = FastAPI(
    title="Zephyros AI Agent",
    version="0.1.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id", "X-Request-Id"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    user_id = request.headers.get("X-User-Id")
    request_log = logger.bind(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        user_id=user_id,
    )

    started_at = time.perf_counter()
    request_log.info("HTTP request started")
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
        request_log.bind(elapsed_ms=elapsed_ms).exception("HTTP request failed")
        raise

    elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
    response.headers["X-Request-Id"] = request_id
    request_log.bind(status_code=response.status_code, elapsed_ms=elapsed_ms).info(
        "HTTP request finished"
    )
    return response


class ChatMessage(BaseModel):
    role: str
    content: str | dict[str, Any]


class ChatRequest(BaseModel):
    message: str
    provider: str | None = None
    model_name: str | None = None
    history: list[ChatMessage] | None = None


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "zephyros_agent"}


@app.post("/agent/chat", response_model=ZephyrosResponse, tags=["Agent"])
async def chat(
    request: ChatRequest,
    x_user_id: str | None = Header(default=None),
) -> ZephyrosResponse:
    user_id: uuid.UUID | None = None
    if x_user_id:
        try:
            user_id = uuid.UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-User-Id format.")

    chat_log = logger.bind(
        endpoint="/agent/chat",
        user_id=str(user_id) if user_id else None,
        requested_provider=request.provider,
        requested_model=request.model_name,
        message_length=len(request.message),
    )
    chat_log.info("Chat request received")

    deps = AgentDeps(http_client=app.state.http_client, user_id=user_id)

    message_history = []
    if request.history:
        for msg in request.history:
            utc_now = datetime.now(timezone.utc)
            if msg.role == "user":
                content_str = msg.content if isinstance(msg.content, str) else json.dumps(msg.content, ensure_ascii=False)
                message_history.append(
                    pydantic_ai_msgs.ModelRequest(
                        parts=[pydantic_ai_msgs.UserPromptPart(content=content_str, timestamp=utc_now)]
                    )
                )
            elif msg.role == "assistant":
                content_str = msg.content if isinstance(msg.content, str) else json.dumps(msg.content, ensure_ascii=False)
                message_history.append(
                    pydantic_ai_msgs.ModelResponse(
                        parts=[pydantic_ai_msgs.TextPart(content=content_str)],
                        timestamp=utc_now,
                    )
                )

    run_history = message_history if message_history else None

    # Explicit provider in request -> use only that one.
    # Autoselection is used only when provider is not passed.
    if request.provider:
        candidates = [request.provider.lower()]
    else:
        candidates = available_provider_chain()

    if not candidates:
        chat_log.error("No AI providers configured")
        raise HTTPException(
            status_code=503,
            detail="Жоден AI-провайдер не налаштований на сервері.",
        )

    chat_log.bind(provider_candidates=candidates).info("Provider candidates resolved")
    last_error: Exception | None = None

    for provider in candidates:
        provider_log = chat_log.bind(provider=provider)
        if _is_down(provider):
            provider_log.warning("Provider is in cooldown, skipping")
            continue

        started_at = time.perf_counter()
        try:
            current_model = build_model(provider, request.model_name)
            model_name = getattr(current_model, "model_name", request.model_name or "default")
            provider_log.bind(model_name=model_name).info("Running agent with provider")
            result = await agent.run(
                request.message,
                deps=deps,
                model=current_model,
                message_history=run_history,
            )
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
            provider_log.bind(elapsed_ms=elapsed_ms).info("Provider returned successful response")
            return result.output

        except ModelHTTPError as e:
            if e.status_code == 401:
                _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
                provider_log.bind(status_code=401, body=_truncate(str(e.body))).error(
                    "Provider authentication error",
                )
                last_error = e
                continue

            if e.status_code == 429:
                retry_after = None
                headers = getattr(e, "headers", None) or {}
                if headers.get("retry-after"):
                    try:
                        retry_after = float(headers["retry-after"])
                    except ValueError:
                        retry_after = None
                cooldown = retry_after or settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS
                _mark_down(provider, cooldown)
                provider_log.bind(status_code=429, cooldown_seconds=cooldown).warning(
                    "Provider rate-limited",
                )
                last_error = e
                continue

            provider_log.bind(
                status_code=e.status_code,
                body=_truncate(str(e.body)),
            ).warning("Provider returned ModelHTTPError")
            last_error = e
            continue

        except ValidationError as e:
            provider_log.bind(error=str(e)).warning("Response validation failed")
            last_error = e
            continue

        except Exception as e:
            provider_log.exception("Unexpected error while running provider")
            last_error = e
            continue

    chat_log.bind(last_error=repr(last_error)).error("All providers exhausted")
    detail_msg = "Агент тимчасово недоступний. Спробуйте за хвилину."
    raise HTTPException(status_code=503, detail=detail_msg)
