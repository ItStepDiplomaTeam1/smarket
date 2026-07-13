import os
import secrets
import string
from functools import lru_cache

import redis.asyncio as redis
from loguru import logger

_OTP_PREFIX = "otp:register:"


def generate_secure_otp(length: int = 4) -> str:
    """Generate a cryptographically secure numeric one-time password."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


@lru_cache
def _get_redis_client() -> redis.Redis:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    return redis.from_url(redis_url, decode_responses=True)


async def save_otp(email: str, otp_code: str, ttl_seconds: int = 300) -> None:
    """Save OTP code to Redis under `otp:register:<email>` with a TTL."""
    client = _get_redis_client()
    key = f"{_OTP_PREFIX}{email.strip().lower()}"
    try:
        await client.setex(key, ttl_seconds, otp_code)
        logger.info(f"OTP code saved in Redis for email: {email}")
    except redis.RedisError as err:
        logger.error(f"Failed to save OTP to Redis for {email}: {err}")
        raise


async def verify_otp(email: str, otp_code: str) -> bool:
    """
    Verify the OTP code for the given email.
    Returns True if correct and removes it from Redis.
    """
    client = _get_redis_client()
    key = f"{_OTP_PREFIX}{email.strip().lower()}"
    try:
        stored_code = await client.get(key)
        if stored_code and stored_code == otp_code:
            await client.delete(key)
            return True
        return False
    except redis.RedisError as err:
        logger.error(f"Failed to verify OTP from Redis for {email}: {err}")
        return False
