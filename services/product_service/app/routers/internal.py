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
from app.database.session import _get_engine, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from sqlalchemy import text, select, func
from datetime import datetime, timezone, timedelta

from app.database.models import Product, Store, Price

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


# ── In-Memory Cache for Dashboard Stats ────────────────────────────────────────
_dashboard_cache: dict | None = None
_dashboard_cache_time: float = 0.0
_DASHBOARD_CACHE_TTL = 60.0  # seconds


@router.get("/dashboard-stats")
async def internal_dashboard_stats(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns aggregate stats for the admin dashboard.
    Cached in-memory for 60 seconds to prevent heavy database scans on every refetch.
    """
    global _dashboard_cache, _dashboard_cache_time
    now = asyncio.get_event_loop().time()

    if _dashboard_cache is not None and (now - _dashboard_cache_time < _DASHBOARD_CACHE_TTL):
        return _dashboard_cache

    try:
        total_products = await db.scalar(select(func.count(Product.id)))
        total_stores = await db.scalar(select(func.count(Store.external_id)))
        
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        prices_updated_today = await db.scalar(
            select(func.count(Price.id)).where(Price.recorded_at >= today)
        )
        
        # Отримання динаміки оновлення цін за останні 7 днів (завжди 7 точок на графіку)
        start_date = today - timedelta(days=6)
        days_map = {
            (start_date + timedelta(days=i)).strftime("%d.%m"): 0
            for i in range(7)
        }
        stmt = (
            select(
                func.date_trunc(text("'day'"), Price.recorded_at).label('day'),
                func.count(Price.id).label('count')
            )
            .where(Price.recorded_at >= start_date)
            .group_by(func.date_trunc(text("'day'"), Price.recorded_at))
            .order_by(func.date_trunc(text("'day'"), Price.recorded_at).asc())
        )
        result = await db.execute(stmt)
        for row in result.all():
            if row.day:
                date_str = row.day.strftime("%d.%m")
                if date_str in days_map:
                    days_map[date_str] = row.count

        price_dynamics = [{"name": name, "value": count} for name, count in days_map.items()]
        # Отримання кількості товарів без категорії (аномалії)
        products_without_category = await db.scalar(
            select(func.count(Product.id)).where(Product.canonical_category_id.is_(None))
        )
        
        # Отримання кількості прихованих (неактивних) товарів
        hidden_products = await db.scalar(
            select(func.count(Product.id)).where(Product.is_hidden == True)
        )
        
        res = {
            "totalProducts": total_products or 0,
            "totalStores": total_stores or 0,
            "pricesUpdatedToday": prices_updated_today or 0,
            "priceDynamics": price_dynamics,
            "productsWithoutCategory": products_without_category or 0,
            "hiddenProducts": hidden_products or 0
        }

        _dashboard_cache = res
        _dashboard_cache_time = now
        return res
    except Exception as exc:
        logger.error(f"[dashboard-stats] failed: {exc}")
        if _dashboard_cache is not None:
            return _dashboard_cache
        return {
            "totalProducts": 0,
            "totalStores": 0,
            "pricesUpdatedToday": 0,
            "priceDynamics": [],
            "productsWithoutCategory": 0,
            "hiddenProducts": 0
        }

