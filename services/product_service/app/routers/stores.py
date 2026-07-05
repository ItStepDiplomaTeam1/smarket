from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database.models import Store
from app.shared.schemas import StoreResponse, StoreStatsResponse
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


RETAIL_CHAIN_INFO = {
    "novus": {
        "description": "Novus — сучасна українська мережа супермаркетів, що пропонує широкий асортимент свіжих продуктів, власну кулінарію та високу якість обслуговування.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Novus_logo.png",
    },
    "atb": {
        "description": "АТБ-Маркет — найбільша та найпопулярніша українська мережа супермаркетів-дискаунтерів з доступними цінами та швидким обслуговуванням.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/ec/ATB-Market-Logo.png",
    },
    "silpo": {
        "description": "Сільпо — мережа супермаркетів з особливою атмосферою, дизайнерськими концепціями магазинів та великим вибором імпортних товарів і делікатесів.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Silpo_logo.png",
    },
    "auchan": {
        "description": "Ашан — міжнародна мережа гіпермаркетів, що забезпечує клієнтів великим вибором продовольчих та непродовольчих товарів за привабливими цінами.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/8/87/Auchan_logo.svg",
    },
    "metro": {
        "description": "METRO Cash & Carry — провідний міжнародний постачальник товарів для роздрібної торгівлі та сегменту HoReCa в оптових та великих обсягах.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/90/Metro_Cash_%26_Carry_logo.svg",
    },
    "ekomarket": {
        "description": "Еко Маркет — всеукраїнська мережа економ-супермаркетів, орієнтована на забезпечення покупців свіжими продуктами щодня за низькими цінами.",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/d/de/Eko-market-logo.png",
    },
}


@router.get(
    "/{store_id}/stats",
    response_model=StoreStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Статистика товарів магазину",
    description="Повертає загальну кількість товарів у наявності, кількість акційних товарів та максимальний розмір знижки.",
)
async def get_store_stats(
    store_id: str,
    db: AsyncSession = Depends(get_db),
):
    # 1. Перевіряємо чи існує магазин та отримуємо його дані
    store = await db.scalar(select(Store).where(Store.external_id == store_id))
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Магазин з id={store_id} не знайдено",
        )

    # 2. Виконуємо сирий SQL для швидкості та простоти читання
    query = text("""
        WITH latest_prices AS (
            SELECT DISTINCT ON (product_id) product_id, price, old_price, in_stock
            FROM prices
            WHERE store_id = :store_id
            ORDER BY product_id, recorded_at DESC
        )
        SELECT 
            COUNT(*)::int AS total_products,
            COUNT(*) FILTER (WHERE old_price IS NOT NULL AND old_price > price)::int AS promo_products,
            COALESCE(
                MAX(
                    CASE 
                        WHEN old_price IS NOT NULL AND old_price > price AND old_price > 0 
                        THEN ROUND(((old_price - price) / old_price) * 100)
                        ELSE 0 
                    END
                ), 
                0
            )::int AS max_savings
        FROM latest_prices
        WHERE in_stock = true;
    """)

    result = await db.execute(query, {"store_id": store_id})
    row = result.one()

    # Визначаємо опис та логотип за retail_chain
    chain_key = store.retail_chain.lower() if store.retail_chain else ""
    chain_info = RETAIL_CHAIN_INFO.get(
        chain_key,
        {
            "description": f"Магазин мережі {store.retail_chain}.",
            "logo_url": f"https://via.placeholder.com/150?text={store.retail_chain}",
        },
    )

    return StoreStatsResponse(
        total_products=row.total_products,
        promo_products=row.promo_products,
        max_savings=row.max_savings,
        store_name=store.name,
        store_description=chain_info["description"],
        store_logo_url=chain_info["logo_url"],
    )
