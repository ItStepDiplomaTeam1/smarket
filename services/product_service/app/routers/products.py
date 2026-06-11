from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database.models import Price, Product
from app.shared.schemas import PriceResponse, ProductDetail, ProductResponse
from app.database.session import get_db

router = APIRouter(default_response_class=ORJSONResponse)


@router.get(
    "/",
    response_model=list[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="Список товарів",
    description="Повертає каталог товарів з можливістю фільтрації та пагінації.",
)
async def get_products(
    skip: int = Query(0, ge=0, description="Кількість записів для пропуску"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт записів у відповіді"),
    brand: Optional[str] = Query(None, description="Фільтр по бренду (часткове співпадіння)"),
    category_id: Optional[int] = Query(None, description="Фільтр по canonical_category_id"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product)

    if brand:
        stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))
    if category_id is not None:
        stmt = stmt.where(Product.canonical_category_id == category_id)

    stmt = stmt.order_by(Product.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{product_id}",
    response_model=ProductDetail,
    status_code=status.HTTP_200_OK,
    summary="Деталі товару",
    description="Повертає товар разом з усіма його цінами в усіх магазинах.",
)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.prices))
        .where(Product.id == product_id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар з id={product_id} не знайдено",
        )
    return product


@router.get(
    "/{product_id}/prices",
    response_model=list[PriceResponse],
    status_code=status.HTTP_200_OK,
    summary="Ціни товару",
    description=(
        "Повертає ціновий лог товару. "
        "Можна фільтрувати по конкретному магазину та наявності на складі."
    ),
)
async def get_product_prices(
    product_id: int,
    store_id: Optional[str] = Query(None, description="Фільтр по ID магазину"),
    in_stock: Optional[bool] = Query(None, description="Тільки товари в наявності"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт записів"),
    db: AsyncSession = Depends(get_db),
):
    # Спочатку перевіримо що товар взагалі існує
    exists = await db.execute(select(Product.id).where(Product.id == product_id))
    if exists.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар з id={product_id} не знайдено",
        )

    stmt = (
        select(Price)
        .where(Price.product_id == product_id)
        .order_by(Price.recorded_at.desc())
    )

    if store_id:
        stmt = stmt.where(Price.store_id == store_id)
    if in_stock is not None:
        stmt = stmt.where(Price.in_stock == in_stock)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())