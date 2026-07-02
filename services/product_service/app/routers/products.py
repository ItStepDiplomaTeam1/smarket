from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta, timezone

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
    ProductWithStoresResponse,
    CategoryResponse,
    PaginatedProductsResponse,
    ProductResponse,
    ProductVisibilityUpdate,
)

from app.database.session import get_db

router = APIRouter(tags=["Products"], default_response_class=ORJSONResponse)


@router.get(
    "/",
    response_model=PaginatedProductsResponse,
    status_code=status.HTTP_200_OK,
    summary="Список товарів",
    description="Повертає каталог товарів з підтримкою фільтрів (ціна, магазини, акції) та глобальним сортуванням.",
)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=1000),
    stores: Optional[str] = Query(
        None, description="Магазини через кому (напр. 'atb,novus')"
    ),
    category: Optional[str] = Query(None, description="ID категорії або 'products'"),
    subcategories: Optional[str] = Query(
        None, description="Слаги підкатегорій через кому"
    ),
    offers: Optional[str] = Query(
        None, description="Фільтри пропозицій (promo, new, save)"
    ),
    max_price: Optional[float] = Query(None, description="Максимальна ціна"),
    search: Optional[str] = Query(None, description="Пошук по назві товару"),
    sort_by: Optional[str] = Query("best_price", description="Сортування"),
    db: AsyncSession = Depends(get_db),
):
    # 1. Парсинг параметрів з фронтенду
    store_ids = [s.strip() for s in stores.split(",")] if stores else []
    subcat_list = [s.strip() for s in subcategories.split(",")] if subcategories else []
    offer_list = [o.strip() for o in offers.split(",")] if offers else []

    # 2. CTE (Common Table Expression) для ОСТАННІХ ЦІН
    # Спочатку знаходимо найсвіжіший запис для кожного товару в кожному магазині
    latest_price_subq = (
        select(
            Price.product_id,
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        ).group_by(Price.product_id, Price.store_id)
    ).subquery("latest_prices")

    # 3. CTE актуальних цін (приєднуємо самі ціни)
    current_prices_stmt = select(
        Price.product_id, Price.store_id, Price.price, Price.old_price, Price.in_stock
    ).join(
        latest_price_subq,
        and_(
            Price.product_id == latest_price_subq.c.product_id,
            Price.store_id == latest_price_subq.c.store_id,
            Price.recorded_at == latest_price_subq.c.max_recorded_at,
        ),
    )

    # Якщо користувач вибрав конкретні магазини, шукаємо по МЕРЕЖІ (retail_chain)
    if store_ids:
        current_prices_stmt = current_prices_stmt.join(
            Store, Price.store_id == Store.external_id
        ).where(Store.retail_chain.in_(store_ids))

    current_prices_cte = current_prices_stmt.cte("current_prices")

    # 4. Агрегація цін для кожного товару (знаходимо мінімальну ціну та чи є акція)
    product_stats_subq = (
        select(
            current_prices_cte.c.product_id,
            func.min(current_prices_cte.c.price).label("min_price"),
            # Використовуємо bool_or щоб перевірити чи є хоча б в одному магазині стара ціна
            func.bool_or(current_prices_cte.c.old_price.isnot(None)).label("has_promo"),
        ).group_by(current_prices_cte.c.product_id)
    ).subquery("product_stats")

    # 5. Будуємо базовий запит Товарів, приєднуючи статистику цін
    base_stmt = (
        select(Product, product_stats_subq.c.min_price, product_stats_subq.c.has_promo)
        .join(product_stats_subq, Product.id == product_stats_subq.c.product_id)
        .options(selectinload(Product.category))
    )

    # 6. Застосування Фільтрів Фронтенду
    if search:
        base_stmt = base_stmt.where(Product.title.ilike(f"%{search}%"))

    # Фільтр по категорії (ігноруємо текстове 'products' з фронтенду)
    if category and category.isdigit():
        base_stmt = base_stmt.where(Product.canonical_category_id == int(category))

    # Фільтр "Підкатегорії" (якщо є поле slug в Category)
    if subcat_list:
        base_stmt = base_stmt.join(Category).where(Category.slug.in_(subcat_list))

    # Фільтр "Ціна до"
    if max_price is not None:
        base_stmt = base_stmt.where(product_stats_subq.c.min_price <= max_price)

    # Фільтри пропозицій
    if "promo" in offer_list or "save" in offer_list:
        base_stmt = base_stmt.where(product_stats_subq.c.has_promo.is_(True))

    if "new" in offer_list:
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        base_stmt = base_stmt.where(Product.created_at >= fourteen_days_ago)

    base_stmt = base_stmt.where(Product.is_hidden == False)

    # 7. Підрахунок загальної кількості для пагінації
    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    total = await db.scalar(count_stmt)

    if not total:
        return PaginatedProductsResponse(total=0, items=[])

    # 8. Сортування
    if sort_by == "cheapest_first":
        base_stmt = base_stmt.order_by(
            product_stats_subq.c.min_price.asc(), Product.id.asc()
        )
    elif sort_by == "best_price":
        # Можна сортувати так само, або за пріоритетом акцій
        base_stmt = base_stmt.order_by(
            product_stats_subq.c.min_price.asc(), Product.id.asc()
        )
    elif sort_by == "popular":
        # Fallback сортування, наприклад за новизною
        base_stmt = base_stmt.order_by(Product.id.desc())
    else:
        base_stmt = base_stmt.order_by(Product.id.asc())

    # 9. Пагінація
    base_stmt = base_stmt.offset(skip).limit(limit)
    result = await db.execute(base_stmt)

    # Отримуємо кортежі: (Product, min_price, has_promo)
    rows = result.all()
    products = [row[0] for row in rows]
    product_ids = [p.id for p in products]

    # 10. Отримання детальних Offers ТІЛЬКИ для відібраних товарів
    offers_stmt = (
        select(Price)
        .options(selectinload(Price.store))
        .join(
            latest_price_subq,
            and_(
                Price.product_id == latest_price_subq.c.product_id,
                Price.store_id == latest_price_subq.c.store_id,
                Price.recorded_at == latest_price_subq.c.max_recorded_at,
            ),
        )
        .where(Price.product_id.in_(product_ids))
    )
    if store_ids:
        offers_stmt = offers_stmt.where(Price.store_id.in_(store_ids))

    offers_result = await db.execute(offers_stmt)
    prices = offers_result.scalars().all()

    # Групуємо ціни за товаром
    prices_by_product = {}
    for price in prices:
        prices_by_product.setdefault(price.product_id, []).append(price)

    # 11. Формування фінальної відповіді
    response_items = []
    for product in products:
        product_prices = prices_by_product.get(product.id, [])
        offers = [
            ProductOfferResponse(
                store=p_price.store,
                price=float(p_price.price),
                old_price=float(p_price.old_price) if p_price.old_price else None,
                in_stock=p_price.in_stock,
                recorded_at=p_price.recorded_at,
            )
            for p_price in product_prices
        ]

        response_items.append(
            ProductOffersResponse(
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
        )

    return PaginatedProductsResponse(total=total, items=response_items)


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
        .where(Product.is_hidden == False)
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


@router.patch(
    "/{product_id}/visibility",
    response_model=ProductResponse,
)
async def update_product_visibility(
    product_id: int,
    body: ProductVisibilityUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    product.is_hidden = body.is_hidden
    await db.commit()
    await db.refresh(product)
    return product


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
    if not product or product.is_hidden:
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

    if not product or product.is_hidden:
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
    if product is None or product.is_hidden:
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
