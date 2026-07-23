"""
Token blacklist module — stores revoked JTI identifiers in Redis.

When a user logs out, their refresh token's JTI is added to Redis with
the token's remaining TTL. On refresh, we check this blacklist to reject
revoked tokens.
"""

import os
from functools import lru_cache

import redis.asyncio as redis
from loguru import logger

_BLACKLIST_PREFIX = "token:blacklist:"


@lru_cache
def _get_redis_client() -> redis.Redis:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    return redis.from_url(redis_url, decode_responses=True)


async def blacklist_token(jti: str, ttl_seconds: int) -> bool:
    """Add a JTI to the blacklist with a TTL matching the token's remaining lifetime."""
    if ttl_seconds <= 0:
        return True
    client = _get_redis_client()
    try:
        await client.setex(f"{_BLACKLIST_PREFIX}{jti}", ttl_seconds, "1")
        logger.debug(f"Token JTI {jti} blacklisted for {ttl_seconds}s")
        return True
    except redis.RedisError:
        logger.exception("Failed to blacklist token JTI")
        return False


async def is_token_blacklisted(jti: str) -> bool:
    """Check whether a JTI has been revoked."""
    client = _get_redis_client()
    try:
        return await client.exists(f"{_BLACKLIST_PREFIX}{jti}") > 0
    except redis.RedisError:
        logger.exception("Failed to check token blacklist — rejecting token")
        return True


async def consume_refresh_token(jti: str, ttl_seconds: int) -> bool:
    """Atomically mark a refresh token as used.

    Returning False means that the token was already consumed or that Redis
    could not safely verify single use. This intentionally fails closed.
    """
    if not jti or ttl_seconds <= 0:
        return False

    client = _get_redis_client()
    try:
        result = await client.set(
            f"{_BLACKLIST_PREFIX}{jti}",
            "1",
            ex=ttl_seconds,
            nx=True,
        )
        return bool(result)
    except redis.RedisError:
        logger.exception("Failed to atomically consume refresh token — rejecting token")
        return False
