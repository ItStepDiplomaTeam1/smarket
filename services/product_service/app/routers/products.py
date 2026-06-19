from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database.models import (
    Price,
    Product,
    StoreProduct,
    Store,
    Category,
)
from app.shared.schemas import (
    PriceResponse,
    PriceWithStoreResponse,
    ProductDetail,
    ProductInStoreResponse,
    ProductOfferResponse,
    ProductOffersResponse,
    ProductResponse,
    ProductWithStoresResponse,
    CategoryResponse,
)
from app.database.session import get_db

router = APIRouter(tags=["Products"], default_response_class=ORJSONResponse)


@router.get(
    "/",
    response_model=list[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="Список товарів",
    description="Повертає каталог товарів з можливістю фільтрації, пошуку та пагінації.",
)
async def get_products(
    skip: int = Query(0, ge=0, description="Кількість записів для пропуску"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт записів у відповіді"),
    brand: Optional[str] = Query(
        None, description="Фільтр по бренду (часткове співпадіння)"
    ),
    category_id: Optional[int] = Query(
        None, description="Фільтр по canonical_category_id"
    ),
    search: Optional[str] = Query(
        None, description="Пошук по назві товару (часткове співпадіння)"
    ),
    store_id: Optional[str] = Query(
        None, description="Фільтр по магазину (показати тільки товари цього магазину)"
    ),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).options(selectinload(Product.category))

    if brand:
        stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))
    if category_id is not None:
        stmt = stmt.where(Product.canonical_category_id == category_id)
    if search:
        stmt = stmt.where(Product.title.ilike(f"%{search}%"))
    if store_id:
        # Фільтр через junction-таблицю store_products
        stmt = stmt.join(StoreProduct, StoreProduct.product_id == Product.id).where(
            StoreProduct.store_id == store_id
        )

    stmt = stmt.order_by(Product.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/by-store/{store_id}",
    response_model=list[ProductInStoreResponse],
    status_code=status.HTTP_200_OK,
    summary="Товари конкретного магазину з актуальними цінами",
    description=(
        "Повертає всі товари конкретного магазину з останньою актуальною ціною. "
        "Ключовий ендпоінт для фронтенду — показує каталог магазину."
    ),
)
async def get_products_by_store(
    store_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category_id: Optional[int] = Query(None, description="Фільтр по категорії"),
    search: Optional[str] = Query(None, description="Пошук по назві товару"),
    in_stock: Optional[bool] = Query(None, description="Тільки товари в наявності"),
    db: AsyncSession = Depends(get_db),
):
    # Перевіряємо що магазин існує
    store_exists = await db.execute(
        select(Store.external_id).where(Store.external_id == store_id)
    )
    if store_exists.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Магазин з id={store_id} не знайдено",
        )

    # Підзапит: остання ціна для кожного товару у цьому магазині
    latest_price_subq = (
        select(
            Price.product_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.store_id == store_id)
        .group_by(Price.product_id)
        .subquery()
    )

    # Основний запит: товари, які є у цьому магазині (через store_products)
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .join(
            StoreProduct,
            and_(
                StoreProduct.product_id == Product.id,
                StoreProduct.store_id == store_id,
            ),
        )
    )

    if category_id is not None:
        stmt = stmt.where(Product.canonical_category_id == category_id)
    if search:
        stmt = stmt.where(Product.title.ilike(f"%{search}%"))

    stmt = stmt.order_by(Product.title).offset(skip).limit(limit)

    result = await db.execute(stmt)
    products = list(result.scalars().all())

    # Отримуємо актуальні ціни для знайдених товарів
    if not products:
        return []

    product_ids = [p.id for p in products]

    prices_stmt = (
        select(Price)
        .join(
            latest_price_subq,
            and_(
                Price.product_id == latest_price_subq.c.product_id,
                Price.recorded_at == latest_price_subq.c.max_recorded_at,
            ),
        )
        .where(Price.store_id == store_id)
        .where(Price.product_id.in_(product_ids))
    )

    prices_result = await db.execute(prices_stmt)
    prices_by_product = {p.product_id: p for p in prices_result.scalars().all()}

    # Збираємо відповідь
    response = []
    for product in products:
        latest_price = prices_by_product.get(product.id)

        # Фільтр in_stock
        if in_stock is not None and latest_price:
            if latest_price.in_stock != in_stock:
                continue

        response.append(
            ProductInStoreResponse(
                id=product.id,
                ean=product.ean,
                store_product_id=product.store_product_id,
                title=product.title,
                brand=product.brand,
                unit=product.unit,
                weight=product.weight,
                image_url=product.image_url,
                canonical_category_id=product.canonical_category_id,
                category=product.category,
                created_at=product.created_at,
                latest_price=PriceResponse(
                    id=latest_price.id,
                    product_id=latest_price.product_id,
                    store_id=latest_price.store_id,
                    price=float(latest_price.price),
                    old_price=float(latest_price.old_price)
                    if latest_price.old_price
                    else None,
                    in_stock=latest_price.in_stock,
                    recorded_at=latest_price.recorded_at,
                )
                if latest_price
                else None,
            )
        )

    return response


@router.get(
    "/{product_id}",
    response_model=ProductDetail,
    status_code=status.HTTP_200_OK,
    summary="Деталі товару",
    description="Повертає товар разом з актуальною ціною в кожному магазині (остання зафіксована ціна, без дублікатів).",
)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    product = await db.scalar(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар з id={product_id} не знайдено",
        )

    # Підзапит: остання ціна для кожного магазину (щоб не було дублікатів з лог-таблиці)
    latest_price_subq = (
        select(
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.product_id == product_id)
        .group_by(Price.store_id)
        .subquery()
    )

    prices_stmt = (
        select(Price)
        .options(selectinload(Price.store))
        .join(
            latest_price_subq,
            and_(
                Price.store_id == latest_price_subq.c.store_id,
                Price.recorded_at == latest_price_subq.c.max_recorded_at,
            ),
        )
        .where(Price.product_id == product_id)
        .order_by(Price.price)
    )

    prices_result = await db.execute(prices_stmt)
    latest_prices = list(prices_result.scalars().all())

    return ProductDetail(
        id=product.id,
        ean=product.ean,
        store_product_id=product.store_product_id,
        title=product.title,
        brand=product.brand,
        unit=product.unit,
        weight=product.weight,
        image_url=product.image_url,
        canonical_category_id=product.canonical_category_id,
        category=product.category,
        created_at=product.created_at,
        prices=latest_prices,
    )


@router.get(
    "/{product_id}/stores",
    response_model=ProductWithStoresResponse,
    status_code=status.HTTP_200_OK,
    summary="Магазини, де продається товар",
    description="Повертає товар зі списком усіх магазинів, де він продається.",
)
async def get_product_stores(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Product)
        .options(
            selectinload(Product.store_products).selectinload(StoreProduct.store),
            selectinload(Product.category),
        )
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
    "/{product_id}/offers",
    response_model=ProductOffersResponse,
    status_code=status.HTTP_200_OK,
    summary="Актуальні пропозиції товару",
    description=(
        "Повертає товар разом з актуальною ціною в кожному магазині (остання зафіксована ціна), "
        "включаючи інформацію про магазин: назву, мережу, місто. "
        "Ідеально підходить для сторінки товару: один запит — уся потрібна інформація."
    ),
)
async def get_product_offers(
    product_id: int,
    in_stock: Optional[bool] = Query(
        None, description="Обмежити пропозиції лише товарами в наявності"
    ),
    db: AsyncSession = Depends(get_db),
):
    # 1. Знаходимо товар
    product = await db.scalar(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар з id={product_id} не знайдено",
        )

    # 2. Підзапит: остання ціна для кожного магазину
    latest_price_subq = (
        select(
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.product_id == product_id)
        .group_by(Price.store_id)
        .subquery()
    )

    # 3. Вибираємо актуальні ціни з інформацією про магазин
    prices_stmt = (
        select(Price)
        .options(selectinload(Price.store))
        .join(
            latest_price_subq,
            and_(
                Price.store_id == latest_price_subq.c.store_id,
                Price.recorded_at == latest_price_subq.c.max_recorded_at,
            ),
        )
        .where(Price.product_id == product_id)
    )

    if in_stock is not None:
        prices_stmt = prices_stmt.where(Price.in_stock == in_stock)

    prices_stmt = prices_stmt.order_by(Price.price)
    prices_result = await db.execute(prices_stmt)
    latest_prices = prices_result.scalars().all()

    # 4. Збираємо відповідь
    offers = [
        ProductOfferResponse(
            store=price.store,
            price=float(price.price),
            old_price=float(price.old_price) if price.old_price else None,
            in_stock=price.in_stock,
            recorded_at=price.recorded_at,
        )
        for price in latest_prices
    ]

    return ProductOffersResponse(
        id=product.id,
        ean=product.ean,
        store_product_id=product.store_product_id,
        title=product.title,
        brand=product.brand,
        unit=product.unit,
        weight=product.weight,
        image_url=product.image_url,
        canonical_category_id=product.canonical_category_id,
        category=product.category,
        created_at=product.created_at,
        offers=offers,
    )


@router.get(
    "/{product_id}/prices",
    response_model=list[PriceWithStoreResponse],
    status_code=status.HTTP_200_OK,
    summary="Ціни товару",
    description=(
        "Повертає ціновий лог товару з інформацією про магазин. "
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
        .options(selectinload(Price.store))
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


@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Отримати список категорій",
)
async def get_categories(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Category).order_by(Category.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())
