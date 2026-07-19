"""Resilient, token-conscious orchestration for Zephyros chat requests."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Iterable

from loguru import logger
from pydantic import ValidationError
from pydantic_ai.exceptions import ModelHTTPError

from app.config import settings
from app.schemas import ZephyrosResponse


class InvalidResponseError(ValueError):
    """A provider returned data that does not meet the customer response contract."""


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)


def classify_failure(error: Exception) -> str:
    if isinstance(error, asyncio.TimeoutError):
        return "timeout"
    if isinstance(error, ValidationError):
        return "invalid_output"
    if isinstance(error, InvalidResponseError):
        return "invalid_output"
    if isinstance(error, ModelHTTPError):
        if error.status_code in (401, 403):
            return "auth"
        if error.status_code == 429:
            return "rate_limit"
        if error.status_code >= 500:
            return "provider_5xx"
        return "provider_http"
    return "unexpected"


class RoutingMetrics:
    """Low-cardinality counters shared through Redis with a bounded local fallback."""

    def __init__(self, redis: Any | None):
        self.redis = redis
        self._local: dict[str, float] = defaultdict(float)

    @staticmethod
    def _field(name: str, labels: dict[str, str] | None = None) -> str:
        if not labels:
            return name
        suffix = ",".join(f"{key}={labels[key]}" for key in sorted(labels))
        return f"{name}|{suffix}"

    async def increment(
        self,
        name: str,
        amount: float = 1,
        *,
        labels: dict[str, str] | None = None,
    ) -> None:
        field = self._field(name, labels)
        self._local[field] += amount
        if not self.redis:
            return
        try:
            await self.redis.hincrbyfloat("zephyros:routing:metrics", field, amount)
        except Exception:
            return

    async def observe_ms(
        self,
        name: str,
        milliseconds: float,
        *,
        labels: dict[str, str] | None = None,
    ) -> None:
        await self.increment(f"{name}_count", labels=labels)
        await self.increment(f"{name}_sum_ms", milliseconds, labels=labels)
        for boundary in (1000, 3000, 5000, 8000, 12000, 20000):
            if milliseconds <= boundary:
                await self.increment(
                    f"{name}_bucket",
                    labels={**(labels or {}), "le": str(boundary)},
                )
        await self.increment(
            f"{name}_bucket",
            labels={**(labels or {}), "le": "+Inf"},
        )

    async def snapshot(self) -> dict[str, float]:
        if self.redis:
            try:
                raw = await self.redis.hgetall("zephyros:routing:metrics")
                return {str(key): float(value) for key, value in raw.items()}
            except Exception:
                pass
        return dict(self._local)


class ProviderState:
    """Redis-backed circuit and in-flight leases with a bounded local fallback."""

    def __init__(self, redis: Any | None):
        self.redis = redis
        self._local_down: dict[str, float] = {}
        self._local_inflight: dict[str, int] = {}
        self._local_needs_probe: set[str] = set()
        self._local_probes: set[str] = set()

    def _key(self, provider: str, suffix: str) -> str:
        return f"zephyros:provider:{provider}:{suffix}"

    async def is_eligible(self, provider: str, limit: int) -> bool:
        if self._local_down.get(provider, 0) > time.monotonic():
            return False
        if not self.redis:
            return self._local_inflight.get(provider, 0) < limit
        try:
            return not bool(await self.redis.exists(self._key(provider, "cooldown")))
        except Exception:
            return self._local_inflight.get(provider, 0) < limit

    async def acquire(self, provider: str, limit: int) -> bool:
        if not await self.is_eligible(provider, limit):
            return False
        if self.redis:
            try:
                if await self.redis.exists(self._key(provider, "needs_probe")):
                    probe = await self.redis.set(
                        self._key(provider, "half_open"),
                        "1",
                        nx=True,
                        ex=max(2, int(settings.PROVIDER_TIMEOUT_SECONDS) + 2),
                    )
                    if not probe:
                        return False
                count = int(await self.redis.incr(self._key(provider, "inflight")))
                await self.redis.expire(self._key(provider, "inflight"), int(settings.PROVIDER_TIMEOUT_SECONDS) + 5)
                if count <= limit:
                    return True
                await self.redis.decr(self._key(provider, "inflight"))
                return False
            except Exception:
                pass
        if provider in self._local_needs_probe:
            if provider in self._local_probes:
                return False
            self._local_probes.add(provider)
        current = self._local_inflight.get(provider, 0)
        if current >= limit:
            return False
        self._local_inflight[provider] = current + 1
        return True

    async def release(self, provider: str) -> None:
        if self.redis:
            try:
                current = int(await self.redis.decr(self._key(provider, "inflight")))
                if current <= 0:
                    await self.redis.delete(self._key(provider, "inflight"))
                return
            except Exception:
                pass
        self._local_inflight[provider] = max(0, self._local_inflight.get(provider, 1) - 1)

    async def mark_failure(self, provider: str, kind: str, cooldown: float | None = None) -> None:
        # Local dependency errors must not take a healthy external provider down.
        if kind not in {"timeout", "auth", "rate_limit", "provider_5xx", "invalid_output", "unexpected"}:
            return
        seconds = cooldown or settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS
        self._local_down[provider] = time.monotonic() + seconds
        self._local_needs_probe.add(provider)
        self._local_probes.discard(provider)
        if self.redis:
            try:
                await self.redis.set(self._key(provider, "cooldown"), kind, ex=max(1, int(seconds)))
                await self.redis.set(
                    self._key(provider, "needs_probe"),
                    kind,
                    ex=max(60, int(seconds * 10)),
                )
                await self.redis.delete(self._key(provider, "half_open"))
                await self.redis.hincrby(self._key(provider, "outcomes"), kind, 1)
            except Exception:
                pass
        logger.bind(
            event_type="zephyros.provider.circuit_open",
            provider=provider,
            failure_kind=kind,
            cooldown_seconds=seconds,
        ).warning("Provider circuit opened")

    async def mark_success(self, provider: str) -> None:
        self._local_down.pop(provider, None)
        self._local_needs_probe.discard(provider)
        self._local_probes.discard(provider)
        if self.redis:
            try:
                await self.redis.hincrby(self._key(provider, "outcomes"), "success", 1)
                await self.redis.delete(
                    self._key(provider, "cooldown"),
                    self._key(provider, "needs_probe"),
                    self._key(provider, "half_open"),
                )
            except Exception:
                pass
        logger.bind(
            event_type="zephyros.provider.circuit_closed",
            provider=provider,
        ).info("Provider circuit closed")

    async def snapshot(self, providers: Iterable[str]) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        for provider in providers:
            eligible = await self.is_eligible(provider, settings.PROVIDER_CONCURRENCY_LIMIT)
            state: dict[str, Any] = {
                "eligible": eligible,
                "local_cooldown": self._local_down.get(provider, 0) > time.monotonic(),
                "inflight": self._local_inflight.get(provider, 0),
                "outcomes": {},
            }
            if self.redis:
                try:
                    state.update(
                        {
                            "cooldown_seconds": max(
                                0, int(await self.redis.ttl(self._key(provider, "cooldown")))
                            ),
                            "half_open": bool(
                                await self.redis.exists(self._key(provider, "half_open"))
                            ),
                            "inflight": int(
                                await self.redis.get(self._key(provider, "inflight")) or 0
                            ),
                            "outcomes": await self.redis.hgetall(
                                self._key(provider, "outcomes")
                            ),
                        }
                    )
                except Exception:
                    state["shared_state"] = "unavailable"
            result[provider] = state
        return result


class ResponseStore:
    """Versioned response cache and local/distributed single-flight coordination."""

    _inflight: dict[str, asyncio.Future[ZephyrosResponse]] = {}
    _guard = asyncio.Lock()

    def __init__(self, redis: Any | None):
        self.redis = redis
        self._distributed_tokens: dict[str, str] = {}

    @staticmethod
    def key(message: str, history: list[dict[str, Any]] | None, user_scope: str | None) -> str:
        compact_history = (history or [])[-settings.CHAT_HISTORY_MAX_MESSAGES :]
        payload = {"m": " ".join(message.lower().split()), "h": compact_history, "u": user_scope or "anonymous", "v": "v1"}
        return hashlib.sha256(_json(payload).encode()).hexdigest()

    async def versioned_key(
        self,
        base_key: str,
        *,
        user_scope: str | None,
    ) -> str:
        versions = {"catalog": "0", "user": "0"}
        if self.redis:
            try:
                catalog = await self.redis.get("zephyros:version:catalog")
                user = (
                    await self.redis.get(f"zephyros:version:user:{user_scope}")
                    if user_scope
                    else None
                )
                versions = {"catalog": str(catalog or "0"), "user": str(user or "0")}
            except Exception:
                pass
        return hashlib.sha256(f"{base_key}:{_json(versions)}".encode()).hexdigest()

    async def invalidate(self, scope: str, user_scope: str | None = None) -> None:
        if not self.redis:
            return
        if scope not in {"catalog", "user"}:
            raise ValueError("Unsupported cache namespace")
        if scope == "user" and not user_scope:
            raise ValueError("User cache invalidation requires a user scope")
        key = (
            "zephyros:version:catalog"
            if scope == "catalog"
            else f"zephyros:version:user:{user_scope}"
        )
        await self.redis.incr(key)

    @staticmethod
    def cacheable(message: str) -> bool:
        private_or_mutating_words = (
            "додай",
            "добав",
            "видали",
            "удали",
            "очист",
            "відгук",
            "отзыв",
            "кошик",
            "корзин",
            "review",
            "cart",
            "add",
            "remove",
            "clear",
        )
        return not any(word in message.casefold() for word in private_or_mutating_words)

    async def get(self, key: str) -> ZephyrosResponse | None:
        if not self.redis:
            return None
        try:
            raw = await self.redis.get(f"zephyros:chat:cache:{key}")
            return ZephyrosResponse.model_validate_json(raw) if raw else None
        except Exception:
            return None

    async def set(self, key: str, value: ZephyrosResponse) -> None:
        if not self.redis:
            return
        try:
            await self.redis.set(f"zephyros:chat:cache:{key}", value.model_dump_json(), ex=settings.CHAT_CACHE_TTL_SECONDS)
        except Exception:
            pass

    async def join_or_lead(self, key: str) -> tuple[asyncio.Future[ZephyrosResponse], bool]:
        async with self._guard:
            current = self._inflight.get(key)
            if current and not current.done():
                return current, False
            future: asyncio.Future[ZephyrosResponse] = asyncio.get_running_loop().create_future()
            self._inflight[key] = future
            return future, True

    async def acquire_distributed(self, key: str) -> ZephyrosResponse | None:
        """Acquire the cross-worker lease or wait for its typed result."""

        if not self.redis:
            return None
        lock_key = f"zephyros:chat:flight-lock:{key}"
        result_key = f"zephyros:chat:flight-result:{key}"
        token = str(uuid.uuid4())
        observed_leader = False
        deadline = time.monotonic() + min(
            settings.CHAT_SINGLEFLIGHT_TTL_SECONDS,
            settings.CHAT_REQUEST_BUDGET_SECONDS + 2,
        )
        while time.monotonic() < deadline:
            try:
                if observed_leader:
                    raw = await self.redis.get(result_key)
                    if raw:
                        return ZephyrosResponse.model_validate_json(raw)
                acquired = await self.redis.set(
                    lock_key,
                    token,
                    nx=True,
                    ex=settings.CHAT_SINGLEFLIGHT_TTL_SECONDS,
                )
                if acquired:
                    self._distributed_tokens[key] = token
                    return None
                observed_leader = True
                raw = await self.redis.get(result_key)
                if raw:
                    return ZephyrosResponse.model_validate_json(raw)
            except Exception:
                # Redis loss must not take the assistant down; local single-flight
                # remains active in this worker.
                return None
            await asyncio.sleep(0.1)
        raise asyncio.TimeoutError("distributed single-flight wait budget exhausted")

    async def finish(self, key: str, future: asyncio.Future[ZephyrosResponse], value: ZephyrosResponse) -> None:
        token = self._distributed_tokens.pop(key, None)
        if self.redis and token:
            lock_key = f"zephyros:chat:flight-lock:{key}"
            try:
                await self.redis.set(
                    f"zephyros:chat:flight-result:{key}",
                    value.model_dump_json(),
                    ex=settings.CHAT_SINGLEFLIGHT_TTL_SECONDS,
                )
                try:
                    await self.redis.eval(
                        "if redis.call('get', KEYS[1]) == ARGV[1] then "
                        "return redis.call('del', KEYS[1]) else return 0 end",
                        1,
                        lock_key,
                        token,
                    )
                except Exception:
                    if await self.redis.get(lock_key) == token:
                        await self.redis.delete(lock_key)
            except Exception:
                pass
        if not future.done():
            future.set_result(value)
        async with self._guard:
            self._inflight.pop(key, None)


def compact_history(history: list[Any] | None) -> list[Any] | None:
    if not history:
        return None
    result: list[Any] = []
    remaining = settings.CHAT_HISTORY_MAX_CHARS
    for item in reversed(history[-settings.CHAT_HISTORY_MAX_MESSAGES :]):
        # pydantic-ai message objects stringify safely; omit oldest oversized turns.
        size = len(str(item))
        if size > remaining:
            continue
        result.append(item)
        remaining -= size
    return list(reversed(result)) or None


def _all_blocks(blocks: Iterable[Any]) -> list[Any]:
    flattened: list[Any] = []
    stack = list(reversed(list(blocks)))
    while stack:
        block = stack.pop()
        flattened.append(block)
        if getattr(block, "type", None) == "tabs":
            for item in reversed(block.items):
                stack.extend(reversed(item.blocks))
    return flattened


def valid_response(
    value: Any,
    *,
    allowed_product_ids: frozenset[int] = frozenset(),
) -> ZephyrosResponse:
    output = getattr(value, "output", value)
    response = output if isinstance(output, ZephyrosResponse) else ZephyrosResponse.model_validate(output)
    all_blocks = _all_blocks(response.blocks)
    if not response.blocks or len(all_blocks) > settings.CHAT_MAX_BLOCKS:
        raise InvalidResponseError("invalid number of response blocks")
    for block in all_blocks:
        block_type = getattr(block, "type", "")
        if block_type == "text" and len(block.content) > settings.CHAT_MAX_TEXT_CHARS:
            raise InvalidResponseError("response text exceeds configured size")
        if block_type == "table":
            if not block.columns or len(block.columns) > 8 or len(block.rows) > 20:
                raise InvalidResponseError("table dimensions exceed configured size")
            if any(len(row) != len(block.columns) for row in block.rows):
                raise InvalidResponseError("table row does not match its columns")
            if block.highlight_row is not None and not 0 <= block.highlight_row < len(block.rows):
                raise InvalidResponseError("table highlight is out of bounds")
        if block_type == "clarification" and not 2 <= len(block.options) <= 4:
            raise InvalidResponseError("clarification must contain two to four options")
        if block_type == "action_button":
            payload = block.payload
            if block.action == "add_to_cart":
                try:
                    product_id = int(payload.get("product_id"))
                    quantity = int(payload.get("quantity", 1))
                except (TypeError, ValueError):
                    raise InvalidResponseError("cart action payload is invalid") from None
                if quantity < 1 or quantity > 99:
                    raise InvalidResponseError("cart action quantity is invalid")
                if not allowed_product_ids or product_id not in allowed_product_ids:
                    raise InvalidResponseError("cart action product is absent from prepared context")
            elif block.action == "create_review":
                try:
                    product_id = int(payload.get("product_id"))
                    rating = int(payload.get("rating"))
                except (TypeError, ValueError):
                    raise InvalidResponseError("review action payload is invalid") from None
                text = payload.get("text")
                if not 1 <= rating <= 5 or (text is not None and not isinstance(text, str)):
                    raise InvalidResponseError("review action payload is invalid")
                if isinstance(text, str) and len(text) > 2000:
                    raise InvalidResponseError("review text exceeds configured size")
                if not allowed_product_ids or product_id not in allowed_product_ids:
                    raise InvalidResponseError("review product is absent from prepared context")
            elif block.action == "navigate":
                route = payload.get("route")
                if not isinstance(route, str) or not route.startswith("/") or route.startswith("//"):
                    raise InvalidResponseError("navigation route is invalid")
    return response


def degraded_response() -> ZephyrosResponse:
    return ZephyrosResponse.model_validate(
        {
            "blocks": [
                {
                    "type": "fallback",
                    "message": "Zephyros тимчасово не зміг підготувати відповідь.",
                    "suggestion": "Ваш запит збережено — спробуйте ще раз за кілька секунд.",
                }
            ]
        }
    )


@dataclass
class RaceResult:
    response: ZephyrosResponse
    winner: str | None
    cache: str


async def race_first_valid(
    *,
    request_id: str,
    message: str,
    deps: Any,
    history: list[Any] | None,
    candidates: list[str],
    build_model: Callable[[str], Any],
    run_agent: Callable[..., Awaitable[Any]],
    state: ProviderState,
    allowed_product_ids: frozenset[int] = frozenset(),
    fallback_response: ZephyrosResponse | None = None,
    metrics: RoutingMetrics | None = None,
    candidate_timeouts: dict[str, float] | None = None,
    candidate_limits: dict[str, int] | None = None,
    routing_mode: str | None = None,
) -> RaceResult:
    timeouts = candidate_timeouts or {}
    limits = candidate_limits or {}
    eligible = [
        provider
        for provider in candidates
        if await state.acquire(
            provider,
            limits.get(provider, settings.PROVIDER_CONCURRENCY_LIMIT),
        )
    ]
    if metrics:
        await metrics.increment("provider_candidates_eligible", len(eligible))
    if not eligible:
        if metrics:
            await metrics.increment("provider_race_fallback_total", labels={"reason": "none_eligible"})
        return RaceResult(fallback_response or degraded_response(), None, "miss")

    async def attempt(provider: str) -> tuple[str, ZephyrosResponse | None, str | None]:
        started = time.perf_counter()
        if metrics:
            await metrics.increment("provider_attempts_total", labels={"provider": provider})
        try:
            model = build_model(provider)
            output = await asyncio.wait_for(
                run_agent(
                    message[: settings.CHAT_MAX_CONTEXT_CHARS],
                    deps=deps,
                    model=model,
                    message_history=compact_history(history),
                    model_settings={"max_tokens": settings.CHAT_MAX_OUTPUT_TOKENS},
                ),
                timeout=timeouts.get(provider, settings.PROVIDER_TIMEOUT_SECONDS),
            )
            response = valid_response(output, allowed_product_ids=allowed_product_ids)
            usage = None
            usage_reader = getattr(output, "usage", None)
            if callable(usage_reader):
                try:
                    usage = usage_reader()
                except Exception:
                    usage = None
            serialized_size = len(response.model_dump_json())
            estimated_output_tokens = max(1, serialized_size // 4)
            await state.mark_success(provider)
            if metrics:
                await metrics.increment(
                    "provider_attempt_outcomes_total",
                    labels={"provider": provider, "outcome": "valid"},
                )
                await metrics.observe_ms(
                    "provider_attempt_latency",
                    (time.perf_counter() - started) * 1000,
                    labels={"provider": provider},
                )
                await metrics.increment(
                    "prompt_tokens_estimated_total",
                    max(1, len(message[: settings.CHAT_MAX_CONTEXT_CHARS]) // 4),
                    labels={"provider": provider},
                )
                await metrics.increment(
                    "output_tokens_requested_total",
                    settings.CHAT_MAX_OUTPUT_TOKENS,
                    labels={"provider": provider},
                )
                await metrics.increment(
                    "output_tokens_estimated_total",
                    estimated_output_tokens,
                    labels={"provider": provider},
                )
                if usage is not None:
                    await metrics.increment(
                        "provider_reported_input_tokens_total",
                        float(getattr(usage, "input_tokens", 0) or 0),
                        labels={"provider": provider},
                    )
                    await metrics.increment(
                        "provider_reported_output_tokens_total",
                        float(getattr(usage, "output_tokens", 0) or 0),
                        labels={"provider": provider},
                    )
                else:
                    await metrics.increment(
                        "provider_usage_unavailable_total",
                        labels={"provider": provider},
                    )
            logger.bind(
                event_type="zephyros.provider.attempt.completed",
                request_id=request_id,
                provider=provider,
                outcome="validated",
                elapsed_ms=round((time.perf_counter() - started) * 1000, 2),
                requested_output_tokens=settings.CHAT_MAX_OUTPUT_TOKENS,
                estimated_output_tokens=estimated_output_tokens,
                provider_reported_input_tokens=getattr(usage, "input_tokens", None),
                provider_reported_output_tokens=getattr(usage, "output_tokens", None),
            ).info("Provider candidate validated")
            return provider, response, None
        except Exception as error:
            kind = classify_failure(error)
            await state.mark_failure(provider, kind)
            if metrics:
                await metrics.increment(
                    "provider_attempt_outcomes_total",
                    labels={"provider": provider, "outcome": kind},
                )
            logger.bind(
                event_type="zephyros.provider.attempt.failed",
                request_id=request_id,
                provider=provider,
                outcome="failed",
                failure_kind=kind,
                elapsed_ms=round((time.perf_counter() - started) * 1000, 2),
            ).warning("Provider candidate failed")
            return provider, None, kind
        finally:
            await state.release(provider)

    if (routing_mode or settings.ZEPHYROS_ROUTING_MODE) == "sequential":
        for index, provider in enumerate(eligible):
            winner, response, _ = await attempt(provider)
            if response:
                for unstarted in eligible[index + 1 :]:
                    await state.release(unstarted)
                if metrics:
                    await metrics.increment(
                        "provider_winners_total",
                        labels={"provider": winner},
                    )
                return RaceResult(response, winner, "miss")
        if metrics:
            await metrics.increment(
                "provider_race_fallback_total",
                labels={"reason": "sequential_exhausted"},
            )
        return RaceResult(fallback_response or degraded_response(), None, "miss")

    tasks = [
        asyncio.create_task(attempt(provider), name=f"zephyros:{provider}")
        for provider in eligible
    ]
    pending = set(tasks)
    deadline = asyncio.get_running_loop().time() + settings.CHAT_REQUEST_BUDGET_SECONDS
    timed_out = False
    try:
        while pending:
            remaining = deadline - asyncio.get_running_loop().time()
            if remaining <= 0:
                timed_out = True
                break
            done, pending = await asyncio.wait(
                pending,
                timeout=remaining,
                return_when=asyncio.FIRST_COMPLETED,
            )
            if not done:
                timed_out = True
                break
            completed = await asyncio.gather(*done)
            valid = [result for result in completed if result[1] is not None]
            if valid:
                provider, response, _ = min(
                    valid,
                    key=lambda result: eligible.index(result[0]),
                )
                for task in pending:
                    task.cancel()
                await asyncio.gather(*pending, return_exceptions=True)
                if metrics:
                    await metrics.increment(
                        "provider_winners_total",
                        labels={"provider": provider},
                    )
                    await metrics.increment(
                        "provider_attempt_cancellations_total",
                        sum(1 for task in tasks if task.cancelled()),
                    )
                assert response is not None
                return RaceResult(response, provider, "miss")
        if timed_out:
            logger.bind(request_id=request_id).warning(
                "Provider race request budget exhausted"
            )
    except TimeoutError:
        logger.bind(request_id=request_id).warning("Provider race request budget exhausted")
    finally:
        for task in tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
    if metrics:
        await metrics.increment("provider_race_fallback_total", labels={"reason": "exhausted"})
    return RaceResult(fallback_response or degraded_response(), None, "miss")
