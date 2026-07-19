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

from app.agent.zephyros import agent, readonly_agent, available_provider_chain, build_model, probe_provider_health
from app.config import settings
from app.deps import AgentDeps
from app.logging import setup_logging
from app.orchestration import ProviderState, ResponseStore, compact_history, race_first_valid
from app.schemas import ErrorResponse, ZephyrosResponse

setup_logging(level=settings.LOG_LEVEL, json_logs=settings.LOG_JSON)

# Kept as an emergency in-process guard and for backwards-compatible health
# diagnostics.  The authoritative circuit state is ProviderState/Redis.
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
    if until is not None and time.monotonic() < until:
        return True
    if "-" in provider:
        base = provider.split("-")[0]
        base_until = _provider_down_until.get(base)
        if base_until is not None and time.monotonic() < base_until:
            return True
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        timeout=30.0,
    )
    app.state.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    app.state.provider_state = ProviderState(app.state.redis)
    app.state.response_store = ResponseStore(app.state.redis)
    logger.info("Zephyros agent service started")
    try:
        chain = available_provider_chain()
        logger.bind(provider_candidates=chain).info("Resolved available provider candidates")
        
        async def probe_and_handle(prov: str):
            logger.info(f"Probing provider health on startup: {prov}")
            is_healthy = await probe_provider_health(prov, timeout_seconds=10.0)
            if not is_healthy:
                logger.warning(f"Provider {prov} failed startup health probe. Placing in initial cooldown.")
                await app.state.provider_state.mark_failure(
                    prov, "timeout", settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS
                )
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
    request.state.request_id = request_id
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
    # Accepted only for a one-release compatibility window.  Routing ignores it.
    provider: str | None = None
    model_name: str | None = None
    history: list[ChatMessage] | None = None


class ActionExecutionRequest(BaseModel):
    action_token: str


@app.get("/health", tags=["System"])
async def health_check():
    from app.agent.zephyros import PROVIDER_CHAIN, PROVIDER_REGISTRY_VERSION, _provider_available
    snapshots = await app.state.provider_state.snapshot(PROVIDER_CHAIN)
    provider_states = {
        prov: {"configured": _provider_available(prov), **snapshots[prov]}
        for prov in PROVIDER_CHAIN
    }
        
    return {
        "status": "ok",
        "service": "zephyros_agent",
        "registry_version": PROVIDER_REGISTRY_VERSION,
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


def _to_model_history(history: list[ChatMessage] | None) -> list[Any] | None:
    if not history:
        return None
    model_history: list[Any] = []
    for msg in history[-settings.CHAT_HISTORY_MAX_MESSAGES :]:
        utc_now = datetime.now(timezone.utc)
        content = msg.content if isinstance(msg.content, str) else json.dumps(msg.content, ensure_ascii=False)
        content = content[: settings.CHAT_HISTORY_MAX_CHARS]
        if msg.role == "user":
            model_history.append(pydantic_ai_msgs.ModelRequest(parts=[pydantic_ai_msgs.UserPromptPart(content=content, timestamp=utc_now)]))
        elif msg.role == "assistant":
            model_history.append(pydantic_ai_msgs.ModelResponse(parts=[pydantic_ai_msgs.TextPart(content=content)], timestamp=utc_now))
    return compact_history(model_history)


def _response_cacheable(response: ZephyrosResponse) -> bool:
    return not any(
        getattr(block, "type", None) == "action_button"
        and getattr(block, "action", None) == "add_to_cart"
        for block in response.blocks
    )


async def _issue_action_tokens(response: ZephyrosResponse, user_id: uuid.UUID | None) -> ZephyrosResponse:
    """Bind proposed cart mutations to one user and one explicit confirmation."""
    redis_client = getattr(app.state, "redis", None)
    if not redis_client or not user_id:
        return response
    for block in response.blocks:
        if getattr(block, "type", None) != "action_button" or getattr(block, "action", None) != "add_to_cart":
            continue
        payload = dict(block.payload)
        token = str(uuid.uuid4())
        try:
            await redis_client.set(
                f"zephyros:action:{token}",
                json.dumps({"user_id": str(user_id), "action": block.action, "payload": payload}),
                ex=600,
            )
            payload["action_token"] = token
            block.payload = payload
        except Exception:
            logger.bind(action="add_to_cart").warning("Could not issue action token; leaving proposal non-executable")
    return response


@app.post("/agent/actions/execute", tags=["Agent"])
async def execute_action(
    request: ActionExecutionRequest,
    x_user_id: str | None = Header(default=None),
) -> dict[str, Any]:
    """Execute exactly one confirmed cart action. Redis GETDEL makes replays harmless."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication is required")
    redis_client = getattr(app.state, "redis", None)
    http_client = getattr(app.state, "http_client", None)
    if not redis_client or not http_client:
        raise HTTPException(status_code=503, detail="Action service is temporarily unavailable")
    try:
        raw = await redis_client.getdel(f"zephyros:action:{request.action_token}")
    except Exception as error:
        logger.bind(error=str(error)).warning("Action token store unavailable")
        raise HTTPException(status_code=503, detail="Action confirmation is temporarily unavailable") from error
    if not raw:
        raise HTTPException(status_code=409, detail="This action has expired or was already completed")
    action = json.loads(raw)
    if action.get("user_id") != x_user_id or action.get("action") != "add_to_cart":
        raise HTTPException(status_code=403, detail="Action token is not valid for this user")
    payload = action["payload"]
    headers = {"X-User-Id": x_user_id}
    try:
        carts_response = await http_client.get(f"{settings.CART_SERVICE_URL}/", headers=headers, timeout=3.0)
        carts_response.raise_for_status()
        carts = carts_response.json()
        if carts:
            cart_id = carts[0]["id"]
        else:
            created = await http_client.post(f"{settings.CART_SERVICE_URL}/", json={"name": "Мій кошик"}, headers=headers, timeout=3.0)
            created.raise_for_status()
            cart_id = created.json()["id"]
        added = await http_client.post(
            f"{settings.CART_SERVICE_URL}/{cart_id}/items",
            json={"product_id": payload["product_id"], "quantity": payload.get("quantity", 1)},
            headers=headers,
            timeout=3.0,
        )
        added.raise_for_status()
    except (httpx.RequestError, httpx.HTTPStatusError) as error:
        logger.bind(user_id=x_user_id, error=str(error)).warning("Confirmed cart action failed")
        raise HTTPException(status_code=502, detail="Не вдалося додати товар до кошика") from error
    logger.bind(user_id=x_user_id, product_id=payload["product_id"]).info("Confirmed cart action completed")
    return {"status": "success", "message": "Товар додано до кошика."}


@app.post("/agent/chat", response_model=ZephyrosResponse, tags=["Agent"])
async def chat(
    request: ChatRequest,
    http_request: Request,
    x_user_id: str | None = Header(default=None),
) -> ZephyrosResponse:
    user_id: uuid.UUID | None = None
    if x_user_id:
        try:
            user_id = uuid.UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-User-Id format.")

    request_id = getattr(http_request.state, "request_id", str(uuid.uuid4()))
    chat_log = logger.bind(
        request_id=request_id,
        endpoint="/agent/chat",
        user_id=str(user_id) if user_id else None,
        message_length=len(request.message),
    )
    chat_log.info("Chat request received")
    if request.provider or request.model_name:
        chat_log.bind(legacy_provider=request.provider, legacy_model=request.model_name).info(
            "Deprecated client provider selection ignored"
        )

    deps = AgentDeps(
        http_client=getattr(app.state, "http_client", None),
        user_id=user_id,
        redis_client=getattr(app.state, "redis", None),
    )

    candidates = available_provider_chain()
    if not candidates:
        chat_log.error("No AI providers configured")
        return ZephyrosResponse.model_validate({"blocks": [{"type": "fallback", "message": "Промін тимчасово недоступний.", "suggestion": "Спробуйте пізніше."}]})

    cacheable = ResponseStore.cacheable(request.message)
    cache_key = ResponseStore.key(request.message, [m.model_dump() for m in request.history or []], str(user_id) if user_id else None)
    redis_client = getattr(app.state, "redis", None)
    store: ResponseStore = getattr(app.state, "response_store", ResponseStore(redis_client))
    provider_state: ProviderState = getattr(app.state, "provider_state", ProviderState(redis_client))
    if cacheable:
        cached = await store.get(cache_key)
        if cached:
            chat_log.bind(cache="hit").info("Returning cached structured response")
            return cached
    future, leader = await store.join_or_lead(cache_key)
    if not leader:
        chat_log.bind(cache="singleflight-join").info("Joining in-flight chat request")
        return await future

    try:
        result = await race_first_valid(
            request_id=request_id,
            message=request.message,
            deps=deps,
            history=_to_model_history(request.history),
            candidates=candidates,
            build_model=build_model,
            run_agent=readonly_agent.run,
            state=provider_state,
        )
        result.response = await _issue_action_tokens(result.response, user_id)
        if cacheable and result.winner and _response_cacheable(result.response):
            await store.set(cache_key, result.response)
        chat_log.bind(cache=result.cache, winner=result.winner, candidate_count=len(candidates)).info("Chat orchestration completed")
        await store.finish(cache_key, future, result.response)
        return result.response
    except Exception:
        fallback = ZephyrosResponse.model_validate({"blocks": [{"type": "fallback", "message": "Не вдалося підготувати відповідь.", "suggestion": "Спробуйте ще раз."}]})
        await store.finish(cache_key, future, fallback)
        chat_log.exception("Chat orchestration failed")
        return fallback


@app.post("/agent/chat/stream", tags=["Agent"])
async def chat_stream(
    request: ChatRequest,
    http_request: Request,
    x_user_id: str | None = Header(default=None),
) -> StreamingResponse:
    # Keep the endpoint for compatibility.  Streaming raw model chunks would
    # bypass validation and make a first-valid race unsafe, so it emits one
    # validated event once the shared orchestration finishes.
    response = await chat(request, http_request, x_user_id)

    async def event_generator():
        yield f"data: {response.model_dump_json()}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
