from fastapi import APIRouter, Depends, HTTPException, Query, status
# Trigger CI rebuild 2
import httpx
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, func, and_, update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.elements import ColumnElement
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
    SubcategoryResponse,
    GlobalCategoryResponse,
    PaginatedProductsResponse,
    ProductResponse,
    ProductVisibilityUpdate,
    CategoryVisibilityUpdate,
    ProductBatchRequest,
)

from app.database.session import get_db
from app.config import settings

GLOBAL_CATEGORIES = {
    1: "Продукти харчування",
    2: "Напої",
    3: "Алкоголь",
    4: "Для дітей",
    5: "Зоотовари",
    6: "Краса та здоров'я",
    7: "Дім та побут",
    8: "Одяг та взуття",
    9: "Дача, сад, город",
    10: "Канцелярія та книги",
}

router = APIRouter(tags=["Products"], default_response_class=ORJSONResponse)


async def _fetch_latest_product_prices(
    db: AsyncSession,
    product_ids: list[int],
    store_ids: list[str],
) -> list[Price]:
    if not product_ids:
        return []

    latest_price_subq = (
        select(
            Price.product_id,
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.product_id.in_(product_ids))
        .group_by(Price.product_id, Price.store_id)
        .subquery("selected_latest_prices")
    )

    stmt = (
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
    )
    if store_ids:
        stmt = stmt.join(Store, Price.store_id == Store.external_id).where(
            Store.retail_chain.in_(store_ids)
        )

    result = await db.execute(stmt)
    return list(result.scalars().all())


def _build_paginated_products_response(
    total: int,
    products: list[Product],
    prices: list[Price],
) -> PaginatedProductsResponse:
    prices_by_product: dict[int, list[Price]] = {}
    for price in prices:
        prices_by_product.setdefault(price.product_id, []).append(price)

    response_items = []
    for product in products:
        product_prices = sorted(
            prices_by_product.get(product.id, []),
            key=lambda item: float(item.price),
        )
        product_offers = [
            ProductOfferResponse(
                store=product_price.store,
                price=float(product_price.price),
                old_price=(
                    float(product_price.old_price)
                    if product_price.old_price is not None
                    else None
                ),
                in_stock=product_price.in_stock,
                recorded_at=product_price.recorded_at,
            )
            for product_price in product_prices
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
                offers=product_offers,
            )
        )

    return PaginatedProductsResponse(total=total, items=response_items)


@router.get(
    "/",
    response_model=PaginatedProductsResponse,
    status_code=status.HTTP_200_OK,
    summary="Список товарів",
)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=1000),
    stores: Optional[str] = Query(None, description="Магазини через кому"),
    category: Optional[str] = Query(None, description="ID категорії"),
    subcategories: Optional[str] = Query(None, description="Слаги підкатегорій"),
    offers: Optional[str] = Query(None, description="Фільтри пропозицій (promo, new, save)"),
    # === НОВИЙ ПАРАМЕТР З ФРОНТЕНДУ ===
    discounts: Optional[str] = Query(None, description="Розмір знижки через кому (напр. '10,20,30-50')"),
    max_price: Optional[float] = Query(None, description="Максимальна ціна"),
    search: Optional[str] = Query(None, description="Пошук по назві товару"),
    sort_by: Optional[str] = Query("best_price", description="Сортування"),
    db: AsyncSession = Depends(get_db),
):
    # 1. Парсинг параметрів з фронтенду
    store_ids = [s.strip() for s in stores.split(",")] if stores else []
    subcat_list = [s.strip() for s in subcategories.split(",")] if subcategories else []
    offer_list = [o.strip() for o in offers.split(",")] if offers else []
    # Парсинг знижок
    discount_list = [d.strip() for d in discounts.split(",")] if discounts else []

    # "Popular" recommendations do not depend on price aggregates. Selecting the
    # small product page first prevents a category request from grouping the
    # entire immutable price history before LIMIT can be applied.
    has_price_filters = bool(
        store_ids
        or max_price is not None
        or discount_list
        or {"promo", "save"}.intersection(offer_list)
    )
    if sort_by == "popular" and not has_price_filters:
        product_conditions: list[ColumnElement[bool]] = [
            Product.is_hidden.is_(False)
        ]
        if search:
            product_conditions.append(Product.title.ilike(f"%{search}%"))
        if category and category.isdigit():
            product_conditions.append(
                Product.canonical_category_id == int(category)
            )
        if "new" in offer_list:
            fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
            product_conditions.append(Product.created_at >= fourteen_days_ago)

        eligible_products_stmt = select(Product.id.label("product_id"))
        if subcat_list:
            eligible_products_stmt = eligible_products_stmt.join(Category).where(
                Category.slug.in_(subcat_list)
            )
        eligible_products = (
            eligible_products_stmt.where(*product_conditions)
            .subquery("eligible_products")
        )

        fast_total = int(
            await db.scalar(
                select(func.count()).select_from(eligible_products)
            )
            or 0
        )
        if not fast_total:
            return PaginatedProductsResponse(total=0, items=[])

        products_result = await db.execute(
            select(Product)
            .join(
                eligible_products,
                Product.id == eligible_products.c.product_id,
            )
            .options(selectinload(Product.category))
            .order_by(Product.id.desc())
            .offset(skip)
            .limit(limit)
        )
        selected_products = list(products_result.scalars().all())
        selected_ids = [product.id for product in selected_products]
        selected_prices = await _fetch_latest_product_prices(
            db, selected_ids, store_ids
        )
        return _build_paginated_products_response(
            fast_total, selected_products, selected_prices
        )

    # 2. CTE для ОСТАННІХ ЦІН (залишається без змін)
    latest_price_subq = (
        select(
            Price.product_id,
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        ).group_by(Price.product_id, Price.store_id)
    ).subquery("latest_prices")

    # 3. CTE актуальних цін (залишається без змін)
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

    if store_ids:
        current_prices_stmt = current_prices_stmt.join(
            Store, Price.store_id == Store.external_id
        ).where(Store.retail_chain.in_(store_ids))

    current_prices_cte = current_prices_stmt.cte("current_prices")

    # === 4. МОДИФІКАЦІЯ: Агрегація цін + розрахунок МАКСИМАЛЬНОГО ВІДСОТКА ЗНИЖКИ ===
    discount_percent_expr = func.coalesce(
        ((current_prices_cte.c.old_price - current_prices_cte.c.price) / current_prices_cte.c.old_price) * 100,
        0
    )

    product_stats_subq = (
        select(
            current_prices_cte.c.product_id,
            func.min(current_prices_cte.c.price).label("min_price"),
            func.bool_or(current_prices_cte.c.old_price.isnot(None)).label("has_promo"),
            # Обчислюємо найкращу знижку на товар серед усіх доступних магазинів
            func.max(discount_percent_expr).label("max_discount_percent"),
        ).group_by(current_prices_cte.c.product_id)
    ).subquery("product_stats")

    # 5. Будуємо базовий запит Товарів
    base_stmt = (
        select(Product, product_stats_subq.c.min_price, product_stats_subq.c.has_promo)
        .join(product_stats_subq, Product.id == product_stats_subq.c.product_id)
        .options(selectinload(Product.category))
    )

    # 6. Застосування Фільтрів Фронтенду
    if search:
        base_stmt = base_stmt.where(Product.title.ilike(f"%{search}%"))
    if category and category.isdigit():
        base_stmt = base_stmt.where(Product.canonical_category_id == int(category))
    if subcat_list:
        base_stmt = base_stmt.join(Category).where(Category.slug.in_(subcat_list))
    if max_price is not None:
        base_stmt = base_stmt.where(product_stats_subq.c.min_price <= max_price)

    # Фільтри пропозицій (вже працюють за ключами 'promo', 'new', 'save')
    if "promo" in offer_list or "save" in offer_list:
        base_stmt = base_stmt.where(product_stats_subq.c.has_promo.is_(True))
    if "new" in offer_list:
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        base_stmt = base_stmt.where(Product.created_at >= fourteen_days_ago)

    # === НОВИЙ ФІЛЬТР: Розмір знижки ===
    if discount_list:
        discount_conditions = []
        for d in discount_list:
            if "-" in d:  # Якщо прийшов діапазон, наприклад "10-30"
                try:
                    low, high = map(float, d.split("-"))
                    discount_conditions.append(
                        and_(
                            product_stats_subq.c.max_discount_percent >= low,
                            product_stats_subq.c.max_discount_percent <= high
                        )
                    )
                except ValueError:
                    continue
            else:  # Якщо прийшло одне число, наприклад "20" (означає від 20% і вище)
                try:
                    val = float(d)
                    discount_conditions.append(product_stats_subq.c.max_discount_percent >= val)
                except ValueError:
                    continue
        
        if discount_conditions:
            base_stmt = base_stmt.where(or_(*discount_conditions))

    base_stmt = base_stmt.where(Product.is_hidden.is_(False))

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
    prices = await _fetch_latest_product_prices(db, product_ids, store_ids)

    # 11. Формування фінальної відповіді
    return _build_paginated_products_response(int(total), products, prices)


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
        .where(Product.is_hidden.is_(False))
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
    include_hidden: bool = Query(False, description="Показувати приховані категорії"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Category)
    if not include_hidden:
        stmt = stmt.where(Category.is_hidden.is_(False))
    stmt = stmt.order_by(Category.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/categories/{main_category_id}/subcategories",
    response_model=list[SubcategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Підкатегорії за головною категорією",
    description=(
        "Повертає всі неприховані категорії (підкатегорії) "
        "для заданого main_category_id (цілочисельний ідентифікатор 1–10). "
        "Кожна підкатегорія містить product_count — кількість видимих "
        "товарів в цій підкатегорії."
    ),
)
async def get_subcategories_by_main_category(
    main_category_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Повертає підкатегорії (з product_count) для заданого main_category_id."""
    product_count_expr = (
        select(func.count(Product.id))
        .where(
            Product.canonical_category_id == Category.id,
            Product.is_hidden.is_(False),
        )
        .correlate(Category)
        .scalar_subquery()
    )

    stmt = (
        select(
            Category.id,
            Category.slug,
            Category.name,
            Category.main_category_id,
            product_count_expr.label("product_count"),
        )
        .where(
            Category.main_category_id == main_category_id,
            Category.is_hidden.is_(False),
        )
        .order_by(Category.name)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        SubcategoryResponse(
            id=row.id,
            slug=row.slug,
            name=row.name,
            main_category_id=row.main_category_id,
            product_count=row.product_count or 0,
        )
        for row in rows
    ]


@router.patch(
    "/categories/{category_id}/visibility",
    response_model=CategoryResponse,
)
async def update_category_visibility(
    category_id: int,
    body: CategoryVisibilityUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    category.is_hidden = body.is_hidden
    await db.commit()
    await db.refresh(category)
    return category


async def update_search_index_visibility(product_ids: list[int], is_hidden: bool):
    """Надсилає PATCH запит до search_service для часткового оновлення is_hidden"""
    if not product_ids:
        return
        
    documents = [{"id": pid, "is_hidden": is_hidden} for pid in product_ids]
    
    # Розбиваємо на чанки по 1000 документів, щоб не перевантажувати мережу
    chunk_size = 1000
    
    async with httpx.AsyncClient() as client:
        for i in range(0, len(documents), chunk_size):
            chunk = documents[i:i + chunk_size]
            headers = {}
            if settings.SEARCH_INTERNAL_API_TOKEN:
                headers["x-internal-token"] = settings.SEARCH_INTERNAL_API_TOKEN

            try:
                await client.patch(
                    f"{settings.SEARCH_SERVICE_URL}/api/v1/index",
                    json={"documents": chunk},
                    headers=headers,
                    timeout=10.0
                )
            except Exception as e:
                print(f"[ProductService] Error updating search index: {e}")

@router.get(
    "/categories/global",
    response_model=list[GlobalCategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Глобальні категорії",
)
async def get_global_categories(
    db: AsyncSession = Depends(get_db),
):
    """
    Повертає 10 глобальних категорій зі статусом is_hidden.
    Якщо хоча б одна підкатегорія видима, глобальна категорія вважається видимою.
    Якщо всі підкатегорії приховані (або їх немає), вона прихована.
    """
    stmt = (
        select(
            Category.main_category_id,
            func.bool_and(Category.is_hidden).label("all_hidden")
        )
        .where(Category.main_category_id.isnot(None))
        .group_by(Category.main_category_id)
    )
    result = await db.execute(stmt)
    
    status_map = {row.main_category_id: row.all_hidden for row in result.all()}
    
    response = []
    for cid, name in GLOBAL_CATEGORIES.items():
        is_hidden = status_map.get(cid, True)
        response.append(GlobalCategoryResponse(
            id=cid,
            name=name,
            is_hidden=is_hidden
        ))
        
    return response

@router.patch(
    "/categories/global/{main_category_id}/visibility",
    response_model=GlobalCategoryResponse,
)
async def update_global_category_visibility(
    main_category_id: int,
    body: CategoryVisibilityUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Приховує або показує ВСІ підкатегорії цієї глобальної категорії,
    а також ВСІ товари в цих підкатегоріях.
    Синхронізує статус товарів із Meilisearch.
    """
    if main_category_id not in GLOBAL_CATEGORIES:
        raise HTTPException(status_code=404, detail="Глобальну категорію не знайдено")
        
    # 1. Знаходимо всі ID категорій
    cat_stmt = select(Category.id).where(Category.main_category_id == main_category_id)
    cat_result = await db.execute(cat_stmt)
    category_ids = cat_result.scalars().all()
    
    if not category_ids:
        return GlobalCategoryResponse(
            id=main_category_id,
            name=GLOBAL_CATEGORIES[main_category_id],
            is_hidden=body.is_hidden
        )
        
    # 2. Знаходимо всі товари в цих категоріях (щоб оновити Meilisearch)
    prod_stmt = select(Product.id).where(Product.canonical_category_id.in_(category_ids))
    prod_result = await db.execute(prod_stmt)
    product_ids = prod_result.scalars().all()
    
    # 3. Оновлюємо статус в категоріях (PostgreSQL)
    await db.execute(
        update(Category)
        .where(Category.id.in_(category_ids))
        .values(is_hidden=body.is_hidden)
    )
    
    # 4. Оновлюємо статус в товарах (PostgreSQL)
    if product_ids:
        await db.execute(
            update(Product)
            .where(Product.id.in_(product_ids))
            .values(is_hidden=body.is_hidden)
        )
        
    await db.commit()
    
    # 5. Оновлюємо Meilisearch (fire-and-forget, але await для надійності)
    if product_ids:
        import asyncio
        asyncio.create_task(update_search_index_visibility(list(product_ids), body.is_hidden))
        
    return GlobalCategoryResponse(
        id=main_category_id,
        name=GLOBAL_CATEGORIES[main_category_id],
        is_hidden=body.is_hidden
    )


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
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    product.is_hidden = body.is_hidden
    await db.commit()
    await db.refresh(product)
    
    # Синхронізація з Meilisearch
    import asyncio
    asyncio.create_task(update_search_index_visibility([product_id], body.is_hidden))
    
    return product


@router.post(
    "/batch/details",
    response_model=list[ProductDetail],
    status_code=status.HTTP_200_OK,
    summary="Деталі декількох товарів",
)
async def get_products_batch_details(
    request: ProductBatchRequest,
    db: AsyncSession = Depends(get_db),
):
    if not request.product_ids:
        return []

    # 1. Завантажуємо товари
    products_result = await db.scalars(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id.in_(request.product_ids))
    )
    products = list(products_result.all())
    
    if not products:
        return []
        
    found_product_ids = [p.id for p in products]

    # 2. Останні ціни для кожного магазину
    latest_price_subq = (
        select(
            Price.product_id,
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.product_id.in_(found_product_ids))
        .group_by(Price.product_id, Price.store_id)
        .subquery()
    )

    prices_stmt = (
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
        .where(Price.product_id.in_(found_product_ids))
        .order_by(Price.product_id, Price.price)
    )

    prices_result = await db.scalars(prices_stmt)
    prices = list(prices_result.all())

    # 3. Групуємо ціни по товарах
    from collections import defaultdict
    prices_by_product = defaultdict(list)
    for p in prices:
        prices_by_product[p.product_id].append(p)

    results = []
    for product in products:
        results.append(ProductDetail(
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
            prices=prices_by_product[product.id],
        ))
    return results


@router.post(
    "/batch/offers",
    response_model=list[ProductOffersResponse],
    status_code=status.HTTP_200_OK,
    summary="Пропозиції для декількох товарів",
)
async def get_products_batch_offers(
    request: ProductBatchRequest,
    db: AsyncSession = Depends(get_db),
):
    if not request.product_ids:
        return []

    products_result = await db.scalars(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id.in_(request.product_ids))
    )
    products = list(products_result.all())
    
    if not products:
        return []

    found_product_ids = [p.id for p in products]

    latest_price_subq = (
        select(
            Price.product_id,
            Price.store_id,
            func.max(Price.recorded_at).label("max_recorded_at"),
        )
        .where(Price.product_id.in_(found_product_ids))
        .group_by(Price.product_id, Price.store_id)
        .subquery()
    )

    prices_stmt = (
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
        .where(Price.product_id.in_(found_product_ids))
    )

    prices_result = await db.scalars(prices_stmt)
    prices = list(prices_result.all())

    from collections import defaultdict
    offers_by_product = defaultdict(list)
    for price in prices:
        offers_by_product[price.product_id].append(
            ProductOfferResponse(
                store=price.store,
                price=price.price,
                old_price=price.old_price,
                in_stock=price.in_stock,
                recorded_at=price.recorded_at,
            )
        )

    results = []
    for product in products:
        results.append(ProductOffersResponse(
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
            is_hidden=product.is_hidden,
            offers=offers_by_product[product.id],
        ))

    return results


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

    # Оптимальний вибір останніх цін по магазинах через DISTINCT ON
    prices_stmt = (
        select(Price)
        .options(selectinload(Price.store))
        .where(Price.product_id == product_id)
        .distinct(Price.store_id)
        .order_by(Price.store_id, Price.recorded_at.desc())
    )

    prices_result = await db.execute(prices_stmt)
    latest_prices = sorted(list(prices_result.scalars().all()), key=lambda p: p.price)

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
