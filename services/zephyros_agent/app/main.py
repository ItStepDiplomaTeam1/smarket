import json
import time
import uuid
import asyncio
from pydantic_ai import Agent
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis
import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse, StreamingResponse
from loguru import logger
from pydantic import BaseModel, ValidationError
from pydantic_ai.exceptions import ModelHTTPError
import pydantic_ai.messages as pydantic_ai_msgs

from app.agent.zephyros import agent, available_provider_chain, build_model, probe_provider_health
from app.config import settings
from app.deps import AgentDeps
from app.logging import setup_logging
from app.schemas import ErrorResponse, ZephyrosResponse

setup_logging(level=settings.LOG_LEVEL, json_logs=settings.LOG_JSON)

_provider_down_until: dict[str, float] = {}


def _truncate(value: str | None, limit: int = 240) -> str:
    if not value:
        return ""
    return value if len(value) <= limit else f"{value[:limit]}..."


def _error_response(error: str, detail: str, status_code: int = 502) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(error=error, detail=detail).model_dump(),
    )


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
    app.state.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    logger.info("Zephyros agent service started")
    try:
        chain = available_provider_chain()
        logger.bind(provider_candidates=chain).info("Resolved available provider candidates")
        
        async def probe_and_handle(prov: str):
            logger.info(f"Probing provider health on startup: {prov}")
            is_healthy = await probe_provider_health(prov, timeout_seconds=3.0)
            if not is_healthy:
                logger.warning(f"Provider {prov} failed startup health probe. Placing in initial cooldown.")
                _mark_down(prov, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
            else:
                logger.info(f"Provider {prov} passed startup health probe.")

        await asyncio.gather(*(probe_and_handle(p) for p in chain), return_exceptions=True)
    except Exception:
        logger.exception("Error checking available providers on startup")
    yield
    await app.state.http_client.aclose()
    await app.state.redis.close()
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
    import time
    from app.agent.zephyros import PROVIDER_CHAIN, _provider_available
    
    provider_states = {}
    now = time.monotonic()
    
    for prov in PROVIDER_CHAIN:
        configured = _provider_available(prov)
        cooldown_until = _provider_down_until.get(prov, 0.0)
        cooldown_remaining = max(0.0, cooldown_until - now)
        is_blocked = cooldown_remaining > 0.0
        
        provider_states[prov] = {
            "configured": configured,
            "blocked": is_blocked,
            "cooldown_remaining_seconds": round(cooldown_remaining, 1) if is_blocked else 0.0
        }
        
    return {
        "status": "ok",
        "service": "zephyros_agent",
        "providers": provider_states
    }


class SummarizePlanRequest(BaseModel):
    store_name: str
    items_count: int
    total_price: float
    savings_amount: float


SUMMARIZE_SYSTEM_PROMPT = (
    "Напиши 2-3 короткі речення українською для чека з покупками. "
    "Тон — легкий, з дрібкою гумору, але без сарказму. "
    "МОЖНА жартувати про суму економії, кількість товарів, сам процес шопінгу. "
    "НЕ МОЖНА жартувати чи коментувати конкретні товари зі списку — вони можуть бути особистими. "
    "Без емодзі, без окликів у кожному реченні. "
    "Не пиши вітання чи підписи."
)


@app.post("/agent/summarize-plan", tags=["Agent"])
async def summarize_plan(
    request: SummarizePlanRequest,
):
    prompt = (
        f"Магазин: {request.store_name}. "
        f"Кількість товарів: {request.items_count}. "
        f"Загальна сума: {request.total_price:.2f} грн. "
        f"Сума економії: {request.savings_amount:.2f} грн."
    )
    
    candidates = available_provider_chain()
    if not candidates:
        logger.error("No AI providers configured for summarize-plan")
        raise HTTPException(status_code=503, detail="ШІ-провайдери не налаштовані на сервері.")
        
    last_error: Exception | None = None
    for provider in candidates:
        if _is_down(provider):
            logger.warning(f"Provider {provider} is in cooldown, skipping summarize-plan")
            continue
            
        try:
            current_model = build_model(provider)
            simple_agent = Agent(current_model, system_prompt=SUMMARIZE_SYSTEM_PROMPT)
            
            # 4.0 second strict timeout
            result = await asyncio.wait_for(
                simple_agent.run(prompt),
                timeout=4.0
            )
            return {"text": result.data.strip()}
            
        except asyncio.TimeoutError as e:
            _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
            logger.warning(f"Provider {provider} timed out during summarize-plan")
            last_error = e
            continue
        except ModelHTTPError as e:
            if e.status_code in (401, 429) or e.status_code >= 500:
                _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
            logger.warning(f"Provider {provider} returned HTTP error {e.status_code} during summarize-plan")
            last_error = e
            continue
        except Exception as e:
            _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
            logger.exception(f"Unexpected error with provider {provider} during summarize-plan")
            last_error = e
            continue
            
    if last_error is None:
        raise HTTPException(status_code=503, detail="Усі ШІ-провайдери тимчасово недоступні.")
        
    raise HTTPException(status_code=503, detail="Помилка генерації опису чека.")


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

    deps = AgentDeps(
        http_client=app.state.http_client,
        user_id=user_id,
        redis_client=app.state.redis,
    )

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
                if isinstance(msg.content, str):
                    content_str = msg.content.strip()
                    if content_str.startswith("```"):
                        lines = content_str.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        content_str = "\n".join(lines).strip()
                else:
                    content_str = json.dumps(msg.content, ensure_ascii=False)
                message_history.append(
                    pydantic_ai_msgs.ModelResponse(
                        parts=[pydantic_ai_msgs.TextPart(content=content_str)],
                        timestamp=utc_now,
                    )
                )

    run_history = message_history if message_history else None

    # Explicit provider in request -> try that one first, then fall back to others if it fails.
    if request.provider:
        primary = request.provider.lower()
        configured = available_provider_chain()
        if primary in configured:
            candidates = [primary] + [p for p in configured if p != primary]
        else:
            candidates = configured
    else:
        candidates = available_provider_chain()

    if not candidates:
        chat_log.error("No AI providers configured")
        return _error_response(
            error="no_providers",
            detail="ШІ-провайдери не налаштовані на сервері.",
            status_code=503,
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

            if e.status_code >= 500:
                _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
                provider_log.bind(status_code=e.status_code, body=_truncate(str(e.body))).warning(
                    "Provider returned 5xx error",
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
            _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
            provider_log.exception("Unexpected error while running provider")
            last_error = e
            continue

    chat_log.bind(last_error=repr(last_error)).error("All providers exhausted")

    if last_error is None:
        return _error_response(
            error="all_providers_exhausted",
            detail="Усі ШІ-провайдери тимчасово недоступні. Спробуйте за хвилину.",
            status_code=503,
        )

    if isinstance(last_error, ModelHTTPError):
        if last_error.status_code == 401:
            return _error_response(
                error="provider_auth_error",
                detail="Помилка автентифікації ШІ-провайдера. Зверніться до адміністратора.",
                status_code=502,
            )
        if last_error.status_code == 429:
            return _error_response(
                error="provider_rate_limited",
                detail="Забагато запитів до ШІ-провайдера. Спробуйте за хвилину.",
                status_code=429,
            )
        return _error_response(
            error="provider_http_error",
            detail="ШІ-провайдер тимчасово недоступний. Спробуйте інший провайдер.",
            status_code=502,
        )

    if isinstance(last_error, ValidationError):
        return _error_response(
            error="response_parse_error",
            detail="Агент повернув некоректну відповідь. Спробуйте ще раз.",
            status_code=502,
        )

    return _error_response(
        error="provider_http_error",
        detail="ШІ-провайдер тимчасово недоступний. Спробуйте інший провайдер.",
        status_code=502,
    )


@app.post("/agent/chat/stream", tags=["Agent"])
async def chat_stream(
    request: ChatRequest,
    x_user_id: str | None = Header(default=None),
) -> StreamingResponse:
    user_id: uuid.UUID | None = None
    if x_user_id:
        try:
            user_id = uuid.UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-User-Id format.")

    chat_log = logger.bind(
        endpoint="/agent/chat/stream",
        user_id=str(user_id) if user_id else None,
        requested_provider=request.provider,
        requested_model=request.model_name,
        message_length=len(request.message),
    )
    chat_log.info("Chat stream request received")

    deps = AgentDeps(
        http_client=app.state.http_client,
        user_id=user_id,
        redis_client=app.state.redis,
    )

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
                if isinstance(msg.content, str):
                    content_str = msg.content.strip()
                    if content_str.startswith("```"):
                        lines = content_str.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        content_str = "\n".join(lines).strip()
                else:
                    content_str = json.dumps(msg.content, ensure_ascii=False)
                message_history.append(
                    pydantic_ai_msgs.ModelResponse(
                        parts=[pydantic_ai_msgs.TextPart(content=content_str)],
                        timestamp=utc_now,
                    )
                )

    run_history = message_history if message_history else None

    # Explicit provider in request -> try that one first, then fall back to others if it fails.
    if request.provider:
        primary = request.provider.lower()
        configured = available_provider_chain()
        if primary in configured:
            candidates = [primary] + [p for p in configured if p != primary]
        else:
            candidates = configured
    else:
        candidates = available_provider_chain()

    if not candidates:
        chat_log.error("No AI providers configured")
        raise HTTPException(
            status_code=503,
            detail="ШІ-провайдери не налаштовані на сервері.",
        )

    async def event_generator():
        success = False
        last_error = None
        for provider in candidates:
            provider_log = chat_log.bind(provider=provider)
            if _is_down(provider):
                provider_log.warning("Provider is in cooldown, skipping")
                continue

            try:
                current_model = build_model(provider, request.model_name)
                model_name = getattr(current_model, "model_name", request.model_name or "default")
                provider_log.bind(model_name=model_name).info("Running agent stream with provider")

                async with agent.run_stream(
                    request.message,
                    deps=deps,
                    model=current_model,
                    message_history=run_history,
                ) as result:
                    async for message in result.stream():
                        yield f"data: {message.model_dump_json()}\n\n"

                success = True
                break
            except ModelHTTPError as e:
                if e.status_code == 401:
                    _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
                elif e.status_code == 429:
                    retry_after = None
                    headers = getattr(e, "headers", None) or {}
                    if headers.get("retry-after"):
                        try:
                            retry_after = float(headers["retry-after"])
                        except ValueError:
                            retry_after = None
                    cooldown = retry_after or settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS
                    _mark_down(provider, cooldown)
                elif e.status_code >= 500:
                    _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
                
                provider_log.exception("Model HTTP error during agent streaming")
                last_error = e
                continue
            except Exception as e:
                _mark_down(provider, settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS)
                provider_log.exception("Error during agent streaming")
                last_error = e
                continue

        if not success:
            err_msg = {
                "error": "all_providers_exhausted",
                "detail": f"Усі ШІ-провайдери тимчасово недоступні. Помилка: {str(last_error)}"
            }
            yield f"data: {json.dumps(err_msg, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
