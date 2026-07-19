"""Resilient, token-conscious orchestration for Zephyros chat requests."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
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


class ProviderState:
    """Redis-backed circuit and in-flight leases with a bounded local fallback."""

    def __init__(self, redis: Any | None):
        self.redis = redis
        self._local_down: dict[str, float] = {}
        self._local_inflight: dict[str, int] = {}

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
                count = int(await self.redis.incr(self._key(provider, "inflight")))
                await self.redis.expire(self._key(provider, "inflight"), int(settings.PROVIDER_TIMEOUT_SECONDS) + 5)
                if count <= limit:
                    return True
                await self.redis.decr(self._key(provider, "inflight"))
                return False
            except Exception:
                pass
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
        if self.redis:
            try:
                await self.redis.set(self._key(provider, "cooldown"), kind, ex=max(1, int(seconds)))
                await self.redis.hincrby(self._key(provider, "outcomes"), kind, 1)
            except Exception:
                pass

    async def mark_success(self, provider: str) -> None:
        self._local_down.pop(provider, None)
        if self.redis:
            try:
                await self.redis.hincrby(self._key(provider, "outcomes"), "success", 1)
            except Exception:
                pass

    async def snapshot(self, providers: Iterable[str]) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        for provider in providers:
            eligible = await self.is_eligible(provider, settings.PROVIDER_CONCURRENCY_LIMIT)
            result[provider] = {"eligible": eligible, "local_cooldown": self._local_down.get(provider, 0) > time.monotonic()}
        return result


class ResponseStore:
    """Short-lived safe cache and local single-flight coordination."""

    _inflight: dict[str, asyncio.Future[ZephyrosResponse]] = {}
    _guard = asyncio.Lock()

    def __init__(self, redis: Any | None):
        self.redis = redis

    @staticmethod
    def key(message: str, history: list[dict[str, Any]] | None, user_scope: str | None) -> str:
        compact_history = (history or [])[-settings.CHAT_HISTORY_MAX_MESSAGES :]
        payload = {"m": " ".join(message.lower().split()), "h": compact_history, "u": user_scope or "anonymous", "v": "v1"}
        return hashlib.sha256(_json(payload).encode()).hexdigest()

    @staticmethod
    def cacheable(message: str) -> bool:
        mutation_words = ("додай", "видали", "очист", "відгук", "review", "add", "remove", "clear")
        return not any(word in message.lower() for word in mutation_words)

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

    async def finish(self, key: str, future: asyncio.Future[ZephyrosResponse], value: ZephyrosResponse) -> None:
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


def valid_response(value: Any) -> ZephyrosResponse:
    output = getattr(value, "output", value)
    response = output if isinstance(output, ZephyrosResponse) else ZephyrosResponse.model_validate(output)
    if not response.blocks or len(response.blocks) > settings.CHAT_MAX_BLOCKS:
        raise InvalidResponseError("invalid number of response blocks")
    for block in response.blocks:
        if getattr(block, "type", "") == "text" and len(block.content) > settings.CHAT_MAX_TEXT_CHARS:
            raise InvalidResponseError("response text exceeds configured size")
    return response


def degraded_response() -> ZephyrosResponse:
    return ZephyrosResponse.model_validate({"blocks": [{"type": "fallback", "message": "Промін тимчасово не зміг підготувати відповідь.", "suggestion": "Спробуйте ще раз за кілька секунд."}, {"type": "action_button", "label": "Спробувати ще раз", "action": "navigate", "payload": {"route": "/"}}]})


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
) -> RaceResult:
    eligible = [p for p in candidates if await state.acquire(p, settings.PROVIDER_CONCURRENCY_LIMIT)]
    if not eligible:
        return RaceResult(degraded_response(), None, "miss")

    async def attempt(provider: str) -> tuple[str, ZephyrosResponse | None, str | None]:
        started = time.perf_counter()
        try:
            model = build_model(provider)
            output = await asyncio.wait_for(run_agent(message, deps=deps, model=model, message_history=compact_history(history)), timeout=settings.PROVIDER_TIMEOUT_SECONDS)
            response = valid_response(output)
            await state.mark_success(provider)
            logger.bind(request_id=request_id, provider=provider, elapsed_ms=round((time.perf_counter() - started) * 1000, 2)).info("Provider candidate validated")
            return provider, response, None
        except Exception as error:
            kind = classify_failure(error)
            await state.mark_failure(provider, kind)
            logger.bind(request_id=request_id, provider=provider, failure_kind=kind).warning("Provider candidate failed")
            return provider, None, kind
        finally:
            await state.release(provider)

    tasks = [asyncio.create_task(attempt(provider), name=f"zephyros:{provider}") for provider in eligible]
    try:
        for done in asyncio.as_completed(tasks, timeout=settings.CHAT_REQUEST_BUDGET_SECONDS):
            provider, response, _ = await done
            if response:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                return RaceResult(response, provider, "miss")
    except TimeoutError:
        logger.bind(request_id=request_id).warning("Provider race request budget exhausted")
    finally:
        for task in tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
    return RaceResult(degraded_response(), None, "miss")
