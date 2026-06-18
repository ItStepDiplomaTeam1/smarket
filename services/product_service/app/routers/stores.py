from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database.models import Store
from app.shared.schemas import StoreResponse
from app.database.session import get_db

router = APIRouter(default_response_class=ORJSONResponse)


@router.get(
    "/",
    response_model=list[StoreResponse],
    status_code=status.HTTP_200_OK,
    summary="Список магазинів",
    description="Повертає список магазинів, синхронізованих ETL-воркером із Zakaz.ua.",
)
async def get_stores(
    retail_chain: Optional[str] = Query(
        None, description="Фільтр по мережі (auchan, novus, metro...)"
    ),
    city: Optional[str] = Query(None, description="Фільтр по місту"),
    is_active: Optional[bool] = Query(None, description="Тільки активні магазини"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Store)

    if retail_chain:
        stmt = stmt.where(Store.retail_chain == retail_chain)
    if city:
        stmt = stmt.where(Store.city == city)
    if is_active is not None:
        stmt = stmt.where(Store.is_active == is_active)

    stmt = stmt.order_by(Store.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{store_id}",
    response_model=StoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Деталі магазину",
)
async def get_store(
    store_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Store).where(Store.external_id == store_id))
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Магазин з id={store_id} не знайдено",
        )
    return store
