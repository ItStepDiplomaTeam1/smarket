from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid
from loguru import logger

from app.database.session import get_db
from app.database.models import Cart

router = APIRouter(default_response_class=ORJSONResponse)

class UserIdsRequest(BaseModel):
    user_ids: list[str]

@router.post("/carts/counts")
async def get_cart_counts(
    payload: UserIdsRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        valid_uuids = []
        for uid in payload.user_ids:
            try:
                valid_uuids.append(uuid.UUID(uid))
            except ValueError:
                pass

        if not valid_uuids:
            return {}

        stmt = select(Cart.user_id, func.count(Cart.id)).where(Cart.user_id.in_(valid_uuids)).group_by(Cart.user_id)
        result = await db.execute(stmt)
        
        counts = {str(row[0]): row[1] for row in result.all()}
        return counts
    except Exception as exc:
        logger.error(f"[internal-carts-counts] error: {exc}")
        return {}
