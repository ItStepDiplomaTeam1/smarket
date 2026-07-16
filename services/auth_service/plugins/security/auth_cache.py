"""Redis-backed cache for the data needed to authenticate a user.

Only the password *hash* is cached; plaintext passwords and issued tokens are
never written to Redis.  Redis failures intentionally degrade to a database
lookup, so authentication remains available while the cache is unavailable.
"""

import hashlib
import os
from dataclasses import asdict, dataclass
from functools import lru_cache

import orjson
import redis.asyncio as redis
from loguru import logger

from services.auth_service.database.models import User

_CACHE_PREFIX = "auth:user:"
_DEFAULT_TTL_SECONDS = 300


@dataclass(frozen=True)
class CachedAuthUser:
    id: str
    email: str
    hashed_password: str
    role: str
    is_active: bool


def _cache_ttl_seconds() -> int:
    try:
        return max(1, int(os.getenv("AUTH_USER_CACHE_TTL_SECONDS", _DEFAULT_TTL_SECONDS)))
    except ValueError:
        return _DEFAULT_TTL_SECONDS


def _cache_key(email: str) -> str:
    normalized_email = email.strip().lower()
    email_digest = hashlib.sha256(normalized_email.encode("utf-8")).hexdigest()
    return f"{_CACHE_PREFIX}{email_digest}"


@lru_cache
def _get_redis_client() -> redis.Redis:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    return redis.from_url(redis_url, decode_responses=False)


async def get_cached_auth_user(email: str) -> CachedAuthUser | None:
    """Return cached credentials for ``email``, or ``None`` on a cache miss/error."""
    try:
        payload = await _get_redis_client().get(_cache_key(email))
        if payload is None:
            return None
        data = orjson.loads(payload)
        return CachedAuthUser(**data)
    except (TypeError, ValueError, redis.RedisError) as err:
        logger.warning("Auth user cache read failed; falling back to the database: {}", err)
        return None


async def cache_auth_user(user: User) -> None:
    """Store authentication fields with a bounded lifetime."""
    cached_user = CachedAuthUser(
        id=str(user.id),
        email=user.email,
        hashed_password=user.hashed_password,
        role=user.role,
        is_active=user.is_active,
    )
    try:
        await _get_redis_client().setex(
            _cache_key(user.email),
            _cache_ttl_seconds(),
            orjson.dumps(asdict(cached_user)),
        )
    except redis.RedisError as err:
        logger.warning("Auth user cache write failed; continuing without cache: {}", err)


async def invalidate_cached_auth_user(email: str) -> None:
    """Remove cached credentials immediately after user state changes."""
    try:
        await _get_redis_client().delete(_cache_key(email))
    except redis.RedisError as err:
        logger.warning("Auth user cache invalidation failed: {}", err)


async def initialize_auth_cache() -> None:
    """Check cache availability at startup without making Redis mandatory."""
    try:
        await _get_redis_client().ping()
        logger.info("Auth user Redis cache connected")
    except redis.RedisError as err:
        logger.warning("Auth user Redis cache unavailable; database fallback enabled: {}", err)


async def close_auth_cache() -> None:
    """Release the Redis connection pool during application shutdown."""
    if not _get_redis_client.cache_info().currsize:
        return
    try:
        await _get_redis_client().aclose()
    except redis.RedisError as err:
        logger.warning("Auth user cache close failed: {}", err)
    finally:
        _get_redis_client.cache_clear()
