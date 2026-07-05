from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from datetime import datetime, timezone, timedelta

from services.auth_service.database.models import User
from services.auth_service.database.session import get_db

router = APIRouter(default_response_class=ORJSONResponse)

@router.get("/dashboard-stats")
async def internal_dashboard_stats(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns aggregate stats for the admin dashboard.
    This endpoint is meant to be called internally by the Gateway.
    """
    try:
        total_users = await db.scalar(select(func.count(User.id)))
        
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        users_today = await db.scalar(select(func.count(User.id)).where(User.created_at >= today)) or 0
        total_users_yesterday = total_users - users_today
        users_trend = round((users_today / total_users_yesterday * 100), 1) if total_users_yesterday > 0 else 0.0

        return {
            "totalUsers": total_users or 0,
            "totalUsersTrend": users_trend
        }
    except Exception as exc:
        logger.error(f"[dashboard-stats] failed: {exc}")
        return {
            "totalUsers": 0,
            "totalUsersTrend": 0.0
        }
