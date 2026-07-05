from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

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
        
        return {
            "totalUsers": total_users or 0
        }
    except Exception as exc:
        logger.error(f"[dashboard-stats] failed: {exc}")
        return {
            "totalUsers": 0
        }
