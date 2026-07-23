import json
import hmac
import hashlib
import time
import uuid
import asyncio
from pydantic_ai import Agent
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Literal

import redis.asyncio as aioredis
import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, Field
import pydantic_ai.messages as pydantic_ai_msgs

from app.agent.zephyros import (
    PROVIDER_REGISTRY,
    available_provider_chain,
    build_model,
    readonly_agent,
)
from app.config import settings
from app.deps import AgentDeps
from app.logging import setup_logging
from app.orchestration import (
    ProviderState,
    ResponseStore,
    RoutingMetrics,
    classify_failure,
    compact_history,
    race_first_valid,
)
from app.read_context import build_read_context
from app.schemas import TabsBlock, ZephyrosResponse

setup_logging(level=settings.LOG_LEVEL, json_logs=settings.LOG_JSON)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        timeout=30.0,
    )
    app.state.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    app.state.provider_state = ProviderState(app.state.redis)
    app.state.response_store = ResponseStore(app.state.redis)
    app.state.routing_metrics = RoutingMetrics(app.state.redis)
    logger.info("Zephyros agent service started")
    logger.bind(provider_candidate_count=len(available_provider_chain())).info(
        "Resolved configured provider candidates; live health is traffic-driven"
    )
    yield
    await app.state.http_client.aclose()
    await app.state.redis.close()
    logger.info("Zephyros agent service stopped")


import os

debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

app = FastAPI(
    title="Zephyros AI Agent",
    version="0.1.0",
    docs_url="/docs" if debug else None,
    redoc_url="/redoc" if debug else None,
    openapi_url="/openapi.json" if debug else None,
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
    role: Literal["user", "assistant"]
    content: str | dict[str, Any]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=settings.CHAT_MAX_INPUT_CHARS)
    # Accepted only for a one-release compatibility window.  Routing ignores it.
    provider: str | None = None
    model_name: str | None = None
    history: list[ChatMessage] | None = Field(default=None, max_length=50)


class ActionExecutionRequest(BaseModel):
    action_token: str = Field(min_length=1, max_length=128)


class CacheInvalidationRequest(BaseModel):
    scope: Literal["catalog", "user"]
    user_id: str | None = None


def _require_operator_key(value: str | None) -> None:
    configured = settings.ZEPHYROS_OPERATOR_KEY
    if not configured:
        raise HTTPException(status_code=404, detail="Not found")
    if not value or not hmac.compare_digest(value, configured):
        raise HTTPException(status_code=403, detail="Operator credentials are invalid")


def _metric_labels(field: str) -> tuple[str, dict[str, str]]:
    name, separator, raw_labels = field.partition("|")
    if not separator:
        return name, {}
    labels: dict[str, str] = {}
    for part in raw_labels.split(","):
        key, found, value = part.partition("=")
        if found:
            labels[key] = value
    return name, labels


def _metric_total(
    snapshot: dict[str, float],
    name: str,
    *,
    label: tuple[str, str] | None = None,
) -> float:
    total = 0.0
    for field, value in snapshot.items():
        metric_name, labels = _metric_labels(field)
        if metric_name != name:
            continue
        if label and labels.get(label[0]) != label[1]:
            continue
        total += value
    return total


def _slo_observation(snapshot: dict[str, float]) -> dict[str, float | bool | None]:
    request_count = _metric_total(snapshot, "chat_requests_total")
    success_count = sum(
        _metric_total(snapshot, "chat_responses_total", label=("outcome", outcome))
        for outcome in ("success", "direct", "cache", "singleflight")
    )
    success_rate = success_count / request_count if request_count else None

    latency_count = _metric_total(snapshot, "chat_request_latency_count")
    buckets: dict[float, float] = {}
    for field, value in snapshot.items():
        metric_name, labels = _metric_labels(field)
        if metric_name != "chat_request_latency_bucket" or labels.get("le") == "+Inf":
            continue
        try:
            boundary = float(labels["le"])
        except (KeyError, ValueError):
            continue
        buckets[boundary] = buckets.get(boundary, 0.0) + value
    p95_ms: float | None = None
    if latency_count:
        threshold = latency_count * 0.95
        p95_ms = next(
            (boundary for boundary in sorted(buckets) if buckets[boundary] >= threshold),
            None,
        )

    return {
        "sample_size": request_count,
        "success_rate": success_rate,
        "success_rate_met": (
            success_rate >= settings.CHAT_SUCCESS_RATE_SLO
            if success_rate is not None
            else None
        ),
        "latency_p95_ms": p95_ms,
        "latency_p95_met": (
            p95_ms <= settings.CHAT_LATENCY_P95_SLO_MS if p95_ms is not None else None
        ),
    }


@app.get("/health", tags=["System"])
async def health_check():
    from app.agent.zephyros import PROVIDER_REGISTRY_VERSION

    return {
        "status": "ok",
        "service": "zephyros_agent",
        "registry_version": PROVIDER_REGISTRY_VERSION,
        "routing_mode": settings.ZEPHYROS_ROUTING_MODE,
        "parallel_cohort_percent": settings.ZEPHYROS_PARALLEL_COHORT_PERCENT,
        "configured_candidates": len(available_provider_chain()),
    }


@app.get("/internal/diagnostics", tags=["System"], include_in_schema=False)
async def operator_diagnostics(
    x_zephyros_operator_key: str | None = Header(
        default=None,
        alias="X-Zephyros-Operator-Key",
    ),
) -> dict[str, Any]:
    _require_operator_key(x_zephyros_operator_key)
    from app.agent.zephyros import PROVIDER_REGISTRY, PROVIDER_REGISTRY_VERSION

    redis_client = getattr(app.state, "redis", None)
    provider_state: ProviderState = getattr(
        app.state,
        "provider_state",
        ProviderState(redis_client),
    )
    metrics: RoutingMetrics = getattr(
        app.state,
        "routing_metrics",
        RoutingMetrics(redis_client),
    )
    names = [candidate.name for candidate in PROVIDER_REGISTRY]
    snapshots = await provider_state.snapshot(names)
    metric_snapshot = await metrics.snapshot()
    registry = [
        {
            "name": candidate.name,
            "priority": candidate.priority,
            "timeout_seconds": candidate.timeout_seconds,
            "concurrency_limit": candidate.concurrency_limit,
            **snapshots[candidate.name],
        }
        for candidate in PROVIDER_REGISTRY
    ]
    return {
        "registry_version": PROVIDER_REGISTRY_VERSION,
        "routing_mode": settings.ZEPHYROS_ROUTING_MODE,
        "parallel_cohort_percent": settings.ZEPHYROS_PARALLEL_COHORT_PERCENT,
        "slo": {
            "success_rate": settings.CHAT_SUCCESS_RATE_SLO,
            "latency_p95_ms": settings.CHAT_LATENCY_P95_SLO_MS,
            "observed": _slo_observation(metric_snapshot),
        },
        "providers": registry,
        "metrics": metric_snapshot,
    }


@app.post("/internal/cache/invalidate", tags=["System"], include_in_schema=False)
async def invalidate_agent_cache(
    request: CacheInvalidationRequest,
    x_zephyros_operator_key: str | None = Header(
        default=None,
        alias="X-Zephyros-Operator-Key",
    ),
) -> dict[str, str]:
    _require_operator_key(x_zephyros_operator_key)
    if request.scope == "user" and not request.user_id:
        raise HTTPException(status_code=422, detail="user_id is required for user scope")
    redis_client = getattr(app.state, "redis", None)
    store: ResponseStore = getattr(app.state, "response_store", ResponseStore(redis_client))
    try:
        await store.invalidate(request.scope, request.user_id)
    except (ValueError, TypeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    logger.bind(
        event_type="zephyros.cache.invalidated",
        scope=request.scope,
        user_id=request.user_id,
    ).info("Assistant cache namespace invalidated")
    return {"status": "invalidated", "scope": request.scope}


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
    fallback_text = (
        f"План на {request.items_count} товарів у {request.store_name} готовий. "
        f"Загальна сума — {request.total_price:.2f} грн, "
        f"економія — {request.savings_amount:.2f} грн."
    )
    redis_client = getattr(app.state, "redis", None)
    provider_state: ProviderState = getattr(
        app.state,
        "provider_state",
        ProviderState(redis_client),
    )
    metrics: RoutingMetrics = getattr(
        app.state,
        "routing_metrics",
        RoutingMetrics(redis_client),
    )
    policies = {candidate.name: candidate for candidate in PROVIDER_REGISTRY}
    candidates = [
        provider
        for provider in available_provider_chain()
        if await provider_state.acquire(
            provider,
            policies[provider].concurrency_limit,
        )
    ]
    if not candidates:
        await metrics.increment("summary_responses_total", labels={"outcome": "deterministic"})
        return {"text": fallback_text}

    async def attempt(provider: str) -> tuple[str, str | None]:
        try:
            simple_agent = Agent(build_model(provider), system_prompt=SUMMARIZE_SYSTEM_PROMPT)
            result = await asyncio.wait_for(
                simple_agent.run(
                    prompt,
                    model_settings={"max_tokens": 180},
                ),
                timeout=min(6.0, policies[provider].timeout_seconds),
            )
            output = str(getattr(result, "output", getattr(result, "data", ""))).strip()
            if not output:
                raise ValueError("empty summary")
            await provider_state.mark_success(provider)
            return provider, output[:800]
        except Exception as error:
            await provider_state.mark_failure(provider, classify_failure(error))
            return provider, None
        finally:
            await provider_state.release(provider)

    tasks = [asyncio.create_task(attempt(provider)) for provider in candidates]
    try:
        for completed in asyncio.as_completed(tasks, timeout=7.0):
            provider, output = await completed
            if output:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                await metrics.increment(
                    "summary_responses_total",
                    labels={"outcome": "provider", "provider": provider},
                )
                return {"text": output}
    except TimeoutError:
        pass
    finally:
        for task in tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    await metrics.increment("summary_responses_total", labels={"outcome": "deterministic"})
    return {"text": fallback_text}


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


def _all_response_blocks(response: ZephyrosResponse) -> list[Any]:
    flattened: list[Any] = []
    stack = list(reversed(response.blocks))
    while stack:
        block = stack.pop()
        flattened.append(block)
        if isinstance(block, TabsBlock):
            for item in reversed(block.items):
                stack.extend(reversed(item.blocks))
    return flattened


def _response_cacheable(response: ZephyrosResponse) -> bool:
    return not any(
        getattr(block, "type", None) == "fallback"
        or (
            getattr(block, "type", None) == "action_button"
            and getattr(block, "action", None)
            in {"add_to_cart", "remove_from_cart", "clear_cart", "create_review"}
        )
        for block in _all_response_blocks(response)
    )


async def _issue_action_tokens(response: ZephyrosResponse, user_id: uuid.UUID | None) -> ZephyrosResponse:
    """Bind proposed mutations to one user and one explicit confirmation."""
    redis_client = getattr(app.state, "redis", None)
    if not redis_client or not user_id:
        return response
    for block in _all_response_blocks(response):
        if (
            getattr(block, "type", None) != "action_button"
            or getattr(block, "action", None)
            not in {"add_to_cart", "remove_from_cart", "clear_cart", "create_review"}
        ):
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
            logger.bind(action=block.action).warning(
                "Could not issue action token; leaving proposal non-executable"
            )
    return response


@app.post("/agent/actions/execute", tags=["Agent"])
async def execute_action(
    request: ActionExecutionRequest,
    x_user_id: str | None = Header(default=None),
) -> dict[str, Any]:
    """Execute one confirmed mutation. Redis GETDEL makes replays harmless."""
    if not settings.ZEPHYROS_ACTION_EXECUTOR_ENABLED:
        raise HTTPException(status_code=503, detail="Confirmed actions are temporarily disabled")
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication is required")
    redis_client = getattr(app.state, "redis", None)
    http_client = getattr(app.state, "http_client", None)
    metrics: RoutingMetrics = getattr(
        app.state,
        "routing_metrics",
        RoutingMetrics(redis_client),
    )
    if not redis_client or not http_client:
        raise HTTPException(status_code=503, detail="Action service is temporarily unavailable")
    try:
        raw = await redis_client.getdel(f"zephyros:action:{request.action_token}")
    except Exception as error:
        logger.bind(error=str(error)).warning("Action token store unavailable")
        raise HTTPException(status_code=503, detail="Action confirmation is temporarily unavailable") from error
    if not raw:
        await metrics.increment("action_executions_total", labels={"outcome": "replay_or_expired"})
        raise HTTPException(status_code=409, detail="This action has expired or was already completed")
    try:
        action = json.loads(raw)
    except (TypeError, json.JSONDecodeError) as error:
        await metrics.increment("action_executions_total", labels={"outcome": "invalid_token"})
        raise HTTPException(status_code=403, detail="Action token is invalid") from error
    action_name = action.get("action")
    if action.get("user_id") != x_user_id or action_name not in {
        "add_to_cart",
        "remove_from_cart",
        "clear_cart",
        "create_review",
    }:
        await metrics.increment("action_executions_total", labels={"outcome": "forbidden"})
        raise HTTPException(status_code=403, detail="Action token is not valid for this user")
    payload = action["payload"]
    headers = {"X-User-Id": x_user_id}
    try:
        if action_name == "add_to_cart":
            carts_response = await http_client.get(
                f"{settings.CART_SERVICE_URL}/",
                headers=headers,
                timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
            )
            carts_response.raise_for_status()
            carts = carts_response.json()
            if carts:
                cart_id = carts[0]["id"]
            else:
                created = await http_client.post(
                    f"{settings.CART_SERVICE_URL}/",
                    json={"name": "Мій кошик"},
                    headers=headers,
                    timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
                )
                created.raise_for_status()
                cart_id = created.json()["id"]
            mutated = await http_client.post(
                f"{settings.CART_SERVICE_URL}/{cart_id}/items",
                json={
                    "product_id": payload["product_id"],
                    "quantity": payload.get("quantity", 1),
                },
                headers=headers,
                timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
            )
        elif action_name == "remove_from_cart":
            mutated = await http_client.delete(
                f"{settings.CART_SERVICE_URL}/{payload['cart_id']}/items/{payload['item_id']}",
                headers=headers,
                timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
            )
        elif action_name == "clear_cart":
            mutated = await http_client.delete(
                f"{settings.CART_SERVICE_URL}/{payload['cart_id']}",
                headers=headers,
                timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
            )
        else:
            mutated = await http_client.post(
                f"{settings.REVIEWS_SERVICE_URL}/",
                json={
                    "product_id": payload["product_id"],
                    "rating": payload["rating"],
                    "text": payload.get("text"),
                },
                headers=headers,
                timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
            )
        mutated.raise_for_status()
    except (httpx.RequestError, httpx.HTTPStatusError) as error:
        await metrics.increment(
            "action_executions_total",
            labels={"action": str(action_name), "outcome": "dependency_error"},
        )
        logger.bind(
            event_type="zephyros.action.failed",
            user_id=x_user_id,
            action=action_name,
            error_type=type(error).__name__,
        ).warning("Confirmed action failed")
        detail = {
            "add_to_cart": "Не вдалося додати товар до кошика",
            "remove_from_cart": "Не вдалося видалити товар з кошика",
            "clear_cart": "Не вдалося очистити кошик",
            "create_review": "Не вдалося опублікувати відгук",
        }.get(str(action_name), "Не вдалося виконати дію")
        raise HTTPException(status_code=502, detail=detail) from error

    store: ResponseStore = getattr(app.state, "response_store", ResponseStore(redis_client))
    try:
        await store.invalidate("user", x_user_id)
    except Exception:
        logger.bind(action=action_name).warning("User response cache invalidation failed")
    await metrics.increment(
        "action_executions_total",
        labels={"action": str(action_name), "outcome": "success"},
    )
    logger.bind(
        event_type="zephyros.action.completed",
        user_id=x_user_id,
        action=action_name,
        product_id=payload.get("product_id"),
    ).info("Confirmed action completed")
    message = {
        "add_to_cart": "Товар додано до кошика.",
        "remove_from_cart": "Товар видалено з кошика.",
        "clear_cart": "Кошик очищено.",
        "create_review": "Відгук опубліковано.",
    }[action_name]
    return {"status": "success", "message": message}


@app.post("/agent/chat", response_model=ZephyrosResponse, tags=["Agent"])
async def chat(
    request: ChatRequest,
    http_request: Request,
    x_user_id: str | None = Header(default=None),
) -> ZephyrosResponse:
    started_at = time.perf_counter()
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
    chat_log.bind(event_type="zephyros.chat.received").info("Chat request received")
    if request.provider or request.model_name:
        chat_log.bind(legacy_provider=request.provider, legacy_model=request.model_name).info(
            "Deprecated client provider selection ignored"
        )

    deps = AgentDeps(
        http_client=getattr(app.state, "http_client", None),
        user_id=user_id,
        redis_client=getattr(app.state, "redis", None),
    )

    redis_client = getattr(app.state, "redis", None)
    store: ResponseStore = getattr(app.state, "response_store", ResponseStore(redis_client))
    provider_state: ProviderState = getattr(app.state, "provider_state", ProviderState(redis_client))
    metrics: RoutingMetrics = getattr(
        app.state,
        "routing_metrics",
        RoutingMetrics(redis_client),
    )
    await metrics.increment("chat_requests_total")
    if request.provider or request.model_name:
        await metrics.increment("legacy_routing_fields_total")

    cacheable = ResponseStore.cacheable(request.message)
    user_scope = str(user_id) if user_id else None
    base_cache_key = ResponseStore.key(
        request.message,
        [message.model_dump() for message in request.history or []],
        user_scope,
    )
    cache_key = await store.versioned_key(base_cache_key, user_scope=user_scope)
    if cacheable:
        cached = await store.get(cache_key)
        if cached:
            await metrics.increment("chat_cache_total", labels={"outcome": "hit"})
            await metrics.observe_ms(
                "chat_request_latency",
                (time.perf_counter() - started_at) * 1000,
                labels={"route": "cache"},
            )
            await metrics.increment("chat_responses_total", labels={"outcome": "cache"})
            chat_log.bind(
                event_type="zephyros.chat.completed",
                route="cache",
                cache="hit",
            ).info("Returning cached structured response")
            return cached
    await metrics.increment("chat_cache_total", labels={"outcome": "miss"})
    future, leader = await store.join_or_lead(cache_key)
    if not leader:
        chat_log.bind(cache="singleflight-join").info("Joining in-flight chat request")
        response = await future
        await metrics.increment("chat_singleflight_total", labels={"scope": "process"})
        await metrics.increment("chat_responses_total", labels={"outcome": "singleflight"})
        await metrics.observe_ms(
            "chat_request_latency",
            (time.perf_counter() - started_at) * 1000,
            labels={"route": "singleflight"},
        )
        chat_log.bind(
            event_type="zephyros.chat.completed",
            route="singleflight",
        ).info("Chat request joined process-local orchestration")
        return response

    try:
        distributed_result = await store.acquire_distributed(cache_key)
        if distributed_result is not None:
            await store.finish(cache_key, future, distributed_result)
            await metrics.increment("chat_singleflight_total", labels={"scope": "redis"})
            await metrics.increment("chat_responses_total", labels={"outcome": "singleflight"})
            await metrics.observe_ms(
                "chat_request_latency",
                (time.perf_counter() - started_at) * 1000,
                labels={"route": "singleflight"},
            )
            chat_log.bind(
                event_type="zephyros.chat.completed",
                route="singleflight",
                cache="distributed-singleflight-join",
            ).info(
                "Joined cross-worker chat request"
            )
            return distributed_result

        prepared = await build_read_context(
            request.message,
            deps,
            request_id=request_id,
            history=[message.model_dump() for message in request.history or []],
        )
        chat_log = chat_log.bind(
            intent=prepared.intent,
            context_bytes=len(json.dumps(prepared.data, ensure_ascii=False)),
        )
        if prepared.direct_response is not None:
            response = await _issue_action_tokens(prepared.direct_response, user_id)
            if cacheable and _response_cacheable(response):
                await store.set(cache_key, response)
            await store.finish(cache_key, future, response)
            await metrics.increment("chat_responses_total", labels={"outcome": "direct"})
            await metrics.observe_ms(
                "chat_request_latency",
                (time.perf_counter() - started_at) * 1000,
                labels={"route": "deterministic"},
            )
            chat_log.bind(
                event_type="zephyros.chat.completed",
                route="deterministic",
                cache="miss",
            ).info(
                "Chat request completed without provider usage"
            )
            return response

        candidates = available_provider_chain()
        if not candidates:
            fallback = prepared.degraded_response or ZephyrosResponse.model_validate(
                {
                    "blocks": [
                        {
                            "type": "fallback",
                            "message": "Zephyros тимчасово не може сформувати відповідь.",
                            "suggestion": "Спробуйте ще раз за кілька секунд.",
                        }
                    ]
                }
            )
            await store.finish(cache_key, future, fallback)
            await metrics.increment("chat_responses_total", labels={"outcome": "fallback"})
            await metrics.observe_ms(
                "chat_request_latency",
                (time.perf_counter() - started_at) * 1000,
                labels={"route": "fallback"},
            )
            chat_log.bind(
                event_type="zephyros.chat.fallback",
                reason="no-providers",
            ).error("No AI providers configured")
            return fallback

        cohort_identity = user_scope or request_id
        cohort_bucket = int(hashlib.sha256(cohort_identity.encode()).hexdigest()[:8], 16) % 100
        routing_mode = settings.ZEPHYROS_ROUTING_MODE
        if (
            routing_mode == "parallel-race"
            and cohort_bucket >= settings.ZEPHYROS_PARALLEL_COHORT_PERCENT
        ):
            routing_mode = "sequential"
        result = await race_first_valid(
            request_id=request_id,
            message=prepared.render_prompt(request.message),
            deps=deps,
            history=_to_model_history(request.history),
            candidates=candidates,
            build_model=build_model,
            run_agent=readonly_agent.run,
            state=provider_state,
            allowed_product_ids=prepared.allowed_product_ids,
            fallback_response=prepared.degraded_response,
            metrics=metrics,
            candidate_timeouts={
                candidate.name: candidate.timeout_seconds
                for candidate in PROVIDER_REGISTRY
            },
            candidate_limits={
                candidate.name: candidate.concurrency_limit
                for candidate in PROVIDER_REGISTRY
            },
            routing_mode=routing_mode,
        )
        result.response = await _issue_action_tokens(result.response, user_id)
        if cacheable and result.winner and _response_cacheable(result.response):
            await store.set(cache_key, result.response)
        chat_log.bind(
            event_type=(
                "zephyros.chat.completed"
                if result.winner
                else "zephyros.chat.fallback"
            ),
            cache=result.cache,
            winner=result.winner,
            candidate_count=len(candidates),
        ).info("Chat orchestration completed")
        await store.finish(cache_key, future, result.response)
        outcome = "success" if result.winner else "fallback"
        await metrics.increment("chat_responses_total", labels={"outcome": outcome})
        await metrics.observe_ms(
            "chat_request_latency",
            (time.perf_counter() - started_at) * 1000,
            labels={"route": "provider-race"},
        )
        return result.response
    except Exception:
        fallback = ZephyrosResponse.model_validate({"blocks": [{"type": "fallback", "message": "Не вдалося підготувати відповідь.", "suggestion": "Спробуйте ще раз."}]})
        await store.finish(cache_key, future, fallback)
        await metrics.increment("chat_responses_total", labels={"outcome": "internal_error"})
        await metrics.observe_ms(
            "chat_request_latency",
            (time.perf_counter() - started_at) * 1000,
            labels={"route": "internal-error"},
        )
        chat_log.bind(
            event_type="zephyros.chat.fallback",
            reason="internal-error",
        ).exception("Chat orchestration failed")
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
