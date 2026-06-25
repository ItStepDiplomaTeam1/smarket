# ── internal health-check router ──────────────────────────────────────────────
"""
Private endpoint called by the API Gateway to probe all infrastructure.
Never returns HTTP 500 — every exception is caught and mapped to "Помилка".
"""

import asyncio
import logging
import os

import httpx
from fastapi import APIRouter
from fastapi.responses import ORJSONResponse
from sqlalchemy import text

from app.database.session import _get_engine

logger = logging.getLogger(__name__)

router = APIRouter(default_response_class=ORJSONResponse)

# ── Status constants ───────────────────────────────────────────────────────────
OK = "Працює"
FAIL = "Помилка"

# ── Environment-driven URLs (fall back to Docker Compose service names) ────────
_REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
_RABBITMQ_URL = os.getenv(
    "RABBITMQ_URL", "amqp://smarket:secure_rmq_pass_123@rabbitmq:5672/"
)
_MEILISEARCH_URL = os.getenv("MEILISEARCH_URL", "http://meilisearch:7700")

_PROBE_TIMEOUT = 3.0  # seconds per probe


# ── Individual probes ──────────────────────────────────────────────────────────


async def _probe_postgres() -> str:
    try:
        engine = _get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return OK
    except Exception as exc:
        logger.warning("[health] PostgreSQL probe failed: %s", exc)
        return FAIL


async def _probe_redis() -> str:
    try:
        import redis.asyncio as aioredis  # type: ignore[import]

        client = aioredis.from_url(_REDIS_URL, socket_connect_timeout=_PROBE_TIMEOUT)
        pong = await asyncio.wait_for(client.ping(), timeout=_PROBE_TIMEOUT)
        await client.aclose()
        return OK if pong else FAIL
    except Exception as exc:
        logger.warning("[health] Redis probe failed: %s", exc)
        return FAIL


async def _probe_meilisearch() -> str:
    try:
        async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
            resp = await client.get(f"{_MEILISEARCH_URL}/health")
        return OK if resp.status_code == 200 else FAIL
    except Exception as exc:
        logger.warning("[health] Meilisearch probe failed: %s", exc)
        return FAIL


async def _probe_rabbitmq() -> str:
    try:
        import aio_pika  # type: ignore[import]

        conn = await asyncio.wait_for(
            aio_pika.connect_robust(_RABBITMQ_URL),
            timeout=_PROBE_TIMEOUT,
        )
        async with conn:
            channel = await conn.channel()
            is_ok = not channel.is_closed
        return OK if is_ok else FAIL
    except Exception as exc:
        logger.warning("[health] RabbitMQ probe failed: %s", exc)
        return FAIL


# ── Route ─────────────────────────────────────────────────────────────────────


@router.get("/health-check")
async def internal_health_check() -> dict:
    """
    Probes all connected infrastructure in parallel.
    Returns a flat dict: { service_name: "Працює" | "Помилка" }.
    This endpoint is INTERNAL — it must not be exposed to the public internet.
    """
    pg, redis, meili, rmq = await asyncio.gather(
        _probe_postgres(),
        _probe_redis(),
        _probe_meilisearch(),
        _probe_rabbitmq(),
        return_exceptions=False,
    )

    return {
        "PostgreSQL": pg,
        "Redis": redis,
        "Meilisearch": meili,
        "RabbitMQ": rmq,
    }
