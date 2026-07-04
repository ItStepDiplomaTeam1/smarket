import uuid
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel, ValidationError

import time
from app.agent.zephyros import agent, available_provider_chain, build_model
from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from pydantic_ai.exceptions import ModelHTTPError

_provider_down_until: dict[str, float] = {}

def _mark_down(provider: str, seconds: float) -> None:
    _provider_down_until[provider] = time.monotonic() + seconds

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
    logger.info("Zephyros agent service started.")
    yield
    await app.state.http_client.aclose()
    logger.info("Zephyros agent service stopped.")


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
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)


class ChatRequest(BaseModel):
    message: str
    provider: str | None = None
    model_name: str | None = None


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

    deps = AgentDeps(http_client=app.state.http_client, user_id=user_id)

    # Явный провайдер из запроса — используем только его (без автопереключения).
    # Автопереключение — только когда provider не передан явно.
    if request.provider:
        candidates = [request.provider.lower()]
    else:
        candidates = available_provider_chain()

    if not candidates:
        raise HTTPException(status_code=503, detail="Жоден AI-провайдер не налаштований на сервері.")

    last_error: Exception | None = None

    for provider in candidates:
        if _is_down(provider):
            logger.warning(f"Provider '{provider}' is in cooldown, skipping.")
            continue

        try:
            current_model = build_model(provider, request.model_name)
            logger.info(f"Trying provider={provider} model={current_model.model_name}")
            result = await agent.run(request.message, deps=deps, model=current_model)
            return result.output  # ZephyrosResponse напрямую, без ручного парсинга

        except ModelHTTPError as e:
            if e.status_code == 401:
                logger.error(f"[{provider}] Auth error: {e.body}")
                _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
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
                logger.warning(f"[{provider}] Rate limited, cooling down for {cooldown}s")
                _mark_down(provider, cooldown)
                last_error = e
                continue

            logger.warning(f"[{provider}] Model HTTP error {e.status_code}: {e.body}")
            last_error = e
            continue

        except ValidationError as e:
            logger.warning(f"[{provider}] JSON validation failed: {e}")
            last_error = e
            continue

        except Exception as e:
            logger.warning(f"[{provider}] Unexpected error: {e}")
            last_error = e
            continue

    logger.error(f"All providers exhausted. Last error: {last_error}")
    raise HTTPException(status_code=503, detail="Агент тимчасово недоступний. Спробуйте за хвилину.")

