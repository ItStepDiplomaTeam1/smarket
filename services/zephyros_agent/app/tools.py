import asyncio
import re
import uuid
from typing import Any

import httpx
from loguru import logger

from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse


async def _get_json(
    client: httpx.AsyncClient,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    timeout: float,
    attempts: int = 2,
) -> Any:
    """Retry a safe GET once for transport errors and transient upstream status codes."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = await client.get(url, headers=headers, params=params, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
            last_error = error
            retryable = not isinstance(error, httpx.HTTPStatusError) or error.response.status_code >= 500
            if not retryable or attempt + 1 >= attempts:
                break
            await asyncio.sleep(0.15 * (attempt + 1))
    assert last_error is not None
    raise last_error


async def _post_json(
    client: httpx.AsyncClient,
    url: str,
    *,
    json_body: dict[str, Any],
    timeout: float,
    attempts: int = 2,
) -> Any:
    """Retry an idempotent read-only batch POST for transient failures."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = await client.post(url, json=json_body, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
            last_error = error
            retryable = not isinstance(error, httpx.HTTPStatusError) or error.response.status_code >= 500
            if not retryable or attempt + 1 >= attempts:
                break
            await asyncio.sleep(0.15 * (attempt + 1))
    assert last_error is not None
    raise last_error


def _calculate_cart_comparison(cart: dict[str, Any], products: Any) -> list[dict[str, Any]]:
    """Calculate a deterministic comparison from batched product offers."""
    if not isinstance(products, list):
        return []
    products_by_id: dict[int, dict[str, Any]] = {}
    for product in products:
        if not isinstance(product, dict):
            continue
        raw_product_id = product.get("id")
        if raw_product_id is None:
            continue
        try:
            product_id = int(raw_product_id)
        except (TypeError, ValueError):
            continue
        products_by_id[product_id] = product

    valid_items: list[tuple[int, int]] = []
    for item in cart.get("items") or []:
        if not isinstance(item, dict):
            continue
        raw_product_id = item.get("product_id")
        if raw_product_id is None:
            continue
        try:
            product_id = int(raw_product_id)
            quantity = max(1, int(item.get("quantity") or 1))
        except (TypeError, ValueError):
            continue
        valid_items.append((product_id, quantity))
    if not valid_items:
        return []

    stores: dict[str, dict[str, Any]] = {}
    for product_id, quantity in valid_items:
        product = products_by_id.get(product_id, {})
        cheapest_by_store: dict[str, tuple[float, dict[str, Any]]] = {}
        for offer in product.get("offers") or []:
            if not isinstance(offer, dict) or not offer.get("in_stock", False):
                continue
            raw_store = offer.get("store")
            store = raw_store if isinstance(raw_store, dict) else {}
            store_id = offer.get("store_id") or store.get("external_id") or store.get("id")
            raw_price = offer.get("price")
            if raw_price is None:
                continue
            try:
                price = float(raw_price)
            except (TypeError, ValueError):
                continue
            if not store_id or price <= 0:
                continue
            key = str(store_id)
            current = cheapest_by_store.get(key)
            if current is None or price < current[0]:
                cheapest_by_store[key] = (price, store)

        for store_id, (price, store) in cheapest_by_store.items():
            row = stores.setdefault(
                store_id,
                {
                    "store_id": store_id,
                    "store_name": store.get("name") or store.get("retail_chain") or store_id,
                    "retail_chain": store.get("retail_chain") or store.get("name") or store_id,
                    "total_price": 0.0,
                    "found_items_count": 0,
                    "missing_items_count": len(valid_items),
                    "is_complete": False,
                },
            )
            row["total_price"] += price * quantity
            row["found_items_count"] += 1
            row["missing_items_count"] -= 1

    comparison = list(stores.values())
    for row in comparison:
        row["total_price"] = round(row["total_price"], 2)
        row["is_complete"] = row["missing_items_count"] == 0
    comparison.sort(
        key=lambda row: (
            not row["is_complete"],
            row["missing_items_count"],
            row["total_price"],
            row["store_name"],
        )
    )
    return comparison


async def _product_service_cart_comparison(
    cart: dict[str, Any],
    deps: AgentDeps,
) -> list[dict[str, Any]]:
    product_ids: list[int] = []
    for item in cart.get("items") or []:
        if not isinstance(item, dict):
            continue
        raw_product_id = item.get("product_id")
        if raw_product_id is None:
            continue
        try:
            product_ids.append(int(raw_product_id))
        except (TypeError, ValueError):
            continue
    if not product_ids:
        return []
    products = await _post_json(
        deps.http_client,
        f"{settings.PRODUCT_SERVICE_URL}/products/batch/offers",
        json_body={"product_ids": sorted(set(product_ids))},
        timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
    )
    return _calculate_cart_comparison(cart, products)


async def _prepare_cart(
    deps: AgentDeps,
    *,
    compare: bool,
    request_id: str,
) -> Any:
    # Import locally to avoid circular dependencies
    from app.read_context import PreparedReadContext, _cart_snapshot_response, _cart_comparison_response

    if not deps.user_id:
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Увійдіть в акаунт, щоб Zephyros побачив ваш кошик.",
                        "suggestion": "Після входу повторіть цей запит.",
                    }
                ]
            }
        )
        return PreparedReadContext(
            intent="cart_comparison" if compare else "cart_view",
            direct_response=response,
            degraded_response=response,
        )

    headers = {"X-User-Id": str(deps.user_id)}
    try:
        carts = await _get_json(
            deps.http_client,
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
        )
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
        logger.bind(request_id=request_id, intent="cart", error=type(error).__name__).warning(
            "Canonical cart read failed"
        )
        fallback = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Zephyros не зміг завантажити кошик.",
                        "suggestion": "Дані кошика не втрачено. Спробуйте ще раз за кілька секунд.",
                    },
                    {
                        "type": "action_button",
                        "label": "Відкрити кошик",
                        "action": "navigate",
                        "payload": {"route": "/cart"},
                    },
                ]
            }
        )
        return PreparedReadContext(
            intent="cart_comparison" if compare else "cart_view",
            direct_response=fallback,
            degraded_response=fallback,
        )

    if not isinstance(carts, list):
        carts = []
    valid_carts = [value for value in carts if isinstance(value, dict)]
    cart = next(
        (value for value in valid_carts if value.get("items")),
        valid_carts[0] if valid_carts else {"items": []},
    )
    if not compare:
        response = _cart_snapshot_response(cart)
        return PreparedReadContext(intent="cart_view", data={"cart": cart}, direct_response=response)
    if not cart.get("items"):
        response = _cart_snapshot_response(cart)
        return PreparedReadContext(intent="cart_comparison", data={"cart": cart}, direct_response=response)
    cart_id = cart.get("id")
    if not cart_id:
        response = _cart_snapshot_response(cart, comparison_failed=True)
        return PreparedReadContext(
            intent="cart_comparison",
            data={"cart": cart},
            direct_response=response,
            degraded_response=response,
        )

    try:
        comparison = await _get_json(
            deps.http_client,
            f"{settings.CART_SERVICE_URL}/{cart_id}/compare",
            headers=headers,
            timeout=settings.CART_COMPARISON_TIMEOUT_SECONDS,
            attempts=1,
        )
        response = _cart_comparison_response(cart, comparison)
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
        logger.bind(
            request_id=request_id,
            intent="cart_comparison",
            cart_id=str(cart.get("id")),
            error=type(error).__name__,
        ).warning("Canonical cart comparison failed; trying Product Service fallback")
        try:
            comparison = await _product_service_cart_comparison(cart, deps)
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as fallback_error:
            logger.bind(
                request_id=request_id,
                intent="cart_comparison",
                cart_id=str(cart.get("id")),
                error=type(fallback_error).__name__,
            ).warning("Product Service cart comparison fallback failed")
            comparison = []
        response = (
            _cart_comparison_response(cart, comparison)
            if comparison
            else _cart_snapshot_response(cart, comparison_failed=True)
        )

    return PreparedReadContext(
        intent="cart_comparison",
        data={"cart_id": str(cart.get("id")), "comparison": comparison},
        direct_response=response,
        degraded_response=response,
    )


def _compact_search_hit(hit: dict[str, Any]) -> dict[str, Any]:
    offers = hit.get("offers") or hit.get("prices") or []
    compact_offers: list[dict[str, Any]] = []
    seen: set[tuple[str, float]] = set()
    for offer in offers:
        if not isinstance(offer, dict):
            continue
        raw_store = offer.get("store")
        store: dict[str, Any] = raw_store if isinstance(raw_store, dict) else {}
        store_name = offer.get("store_name") or store.get("name") or offer.get("retail_chain")
        try:
            price = float(offer.get("price") or 0)
        except (TypeError, ValueError):
            continue
        key = (str(store_name or ""), price)
        if key in seen:
            continue
        seen.add(key)
        compact_offers.append(
            {
                "store": store_name,
                "store_id": offer.get("store_id") or store.get("external_id"),
                "price": price,
                "in_stock": bool(offer.get("in_stock", True)),
            }
        )
    compact_offers.sort(key=lambda offer: (not offer["in_stock"], offer["price"]))
    return {
        "id": hit.get("id"),
        "title": hit.get("title") or hit.get("name"),
        "brand": hit.get("brand"),
        "category": hit.get("category_name"),
        "price": hit.get("price"),
        "store": hit.get("store_name") or hit.get("retail_chain"),
        "in_stock": hit.get("in_stock"),
        "image_url": hit.get("image_url"),
        "offers": compact_offers[:8],
    }


async def _prepare_catalog(
    message: str,
    deps: AgentDeps,
    request_id: str,
    *,
    add_requested: bool = False,
    preferred_product_id: int | None = None,
) -> Any:
    # Import locally to avoid circular dependencies
    from app.read_context import (
        PreparedReadContext,
        ContextIntent,
        _parse_catalog_query,
        _catalog_product_response,
        _catalog_degraded_response,
    )

    intent: ContextIntent = "cart_add" if add_requested else "catalog_search"
    normalized = message.casefold()
    deals_request = any(
        phrase in normalized
        for phrase in ("вигідні пропозиції", "акційні", "акции", "акції", "знижки", "скидки")
    )
    parsed_query = _parse_catalog_query(message)
    query = parsed_query.query
    search_params: dict[str, Any] = {
        "q": "" if deals_request else query,
        "in_stock": "true",
        "limit": 8,
    }
    if parsed_query.price_min is not None:
        search_params["price_min"] = parsed_query.price_min
    if parsed_query.price_max is not None:
        search_params["price_max"] = parsed_query.price_max
    if deals_request:
        search_params.update({"offer_type": "promo", "sort": "discount_percent:desc"})
    elif parsed_query.sort:
        search_params["sort"] = parsed_query.sort
    try:
        search_data = await _get_json(
            deps.http_client,
            f"{settings.SEARCH_SERVICE_URL}/search",
            params=search_params,
            timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
        )
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
        logger.bind(request_id=request_id, intent="catalog_search", error=type(error).__name__).warning(
            "Canonical catalog search failed"
        )
        fallback = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Zephyros не зміг оновити каталог.",
                        "suggestion": "Повторіть пошук за кілька секунд або відкрийте каталог.",
                    },
                    {
                        "type": "action_button",
                        "label": "Відкрити каталог",
                        "action": "navigate",
                        "payload": {"route": "/"},
                    },
                ]
            }
        )
        return PreparedReadContext(
            intent=intent,
            direct_response=fallback,
            degraded_response=fallback,
        )

    search_mapping = search_data if isinstance(search_data, dict) else {}
    raw_hits = search_mapping.get("hits", [])
    hits: list[dict[str, Any]] = []
    allowed_ids: set[int] = set()
    seen_ids: set[int] = set()
    for hit in raw_hits:
        if not isinstance(hit, dict):
            continue
        raw_product_id = hit.get("id")
        if raw_product_id is None:
            continue
        try:
            product_id = int(raw_product_id)
        except (TypeError, ValueError):
            continue
        if product_id in seen_ids:
            continue
        seen_ids.add(product_id)
        allowed_ids.add(product_id)
        hits.append(_compact_search_hit(hit))
        if len(hits) >= settings.CHAT_CONTEXT_MAX_PRODUCTS:
            break

    if preferred_product_id is not None:
        hits = [product for product in hits if product.get("id") == preferred_product_id]
        allowed_ids = {preferred_product_id} if hits else set()

    data = {
        "query": query,
        "price_min": parsed_query.price_min,
        "price_max": parsed_query.price_max,
        "sort": parsed_query.sort,
        "products": hits,
        "total": search_mapping.get("total_hits"),
    }
    if not hits:
        direct = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "text",
                        "content": f"За запитом «{parsed_query.label}» актуальних товарів не знайдено.",
                    },
                    {
                        "type": "clarification",
                        "question": "Спробуємо ширший запит?",
                        "options": ["Прибрати бренд", "Показати всі магазини"],
                    },
                ]
            }
        )
        return PreparedReadContext(intent=intent, data=data, direct_response=direct)

    direct = _catalog_product_response(
        query,
        hits,
        add_requested=add_requested,
        query_label=parsed_query.label,
    )
    return PreparedReadContext(
        intent=intent,
        data=data,
        direct_response=direct,
        allowed_product_ids=frozenset(allowed_ids),
        degraded_response=_catalog_degraded_response(query, hits),
    )


async def _prepare_add_to_cart(
    message: str,
    deps: AgentDeps,
    request_id: str,
    history: list[dict[str, Any]] | None,
) -> Any:
    # Import locally to avoid circular dependencies
    from app.read_context import PreparedReadContext, _select_history_product, _catalog_query

    referenced = _select_history_product(message, history)
    if referenced is not None:
        product_id = int(referenced["product_id"])
        name = str(referenced.get("name") or "Товар")
        return await _prepare_catalog(
            name,
            deps,
            request_id,
            add_requested=True,
            preferred_product_id=product_id,
        )

    query = _catalog_query(message)
    generic_queries = {"додай", "добавь", "додати", "добав", "у кошик", "в корзину"}
    if query.casefold() in generic_queries or len(query) < 2:
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "clarification",
                        "question": "Який саме товар додати до кошика?",
                        "options": ["Знайти молоко", "Знайти хліб"],
                    }
                ]
            }
        )
        return PreparedReadContext(intent="cart_add", direct_response=response)
    return await _prepare_catalog(
        query,
        deps,
        request_id,
        add_requested=True,
    )


async def _prepare_cart_mutation(
    message: str,
    deps: AgentDeps,
    *,
    clear: bool,
    request_id: str,
    history: list[dict[str, Any]] | None,
) -> Any:
    # Import locally to avoid circular dependencies
    from app.read_context import (
        PreparedReadContext,
        ContextIntent,
        _select_history_product,
    )

    intent: ContextIntent = "cart_clear" if clear else "cart_remove"
    if not deps.user_id:
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Увійдіть в акаунт, щоб змінювати кошик.",
                        "suggestion": "Після входу повторіть дію.",
                    }
                ]
            }
        )
        return PreparedReadContext(intent=intent, direct_response=response)

    try:
        carts = await _get_json(
            deps.http_client,
            f"{settings.CART_SERVICE_URL}/",
            headers={"X-User-Id": str(deps.user_id)},
            timeout=settings.INTERNAL_READ_TIMEOUT_SECONDS,
        )
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as error:
        logger.bind(request_id=request_id, intent=intent, error=type(error).__name__).warning(
            "Cart mutation context read failed"
        )
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Не вдалося завантажити кошик для цієї дії.",
                        "suggestion": "Спробуйте ще раз за кілька секунд.",
                    }
                ]
            }
        )
        return PreparedReadContext(intent=intent, direct_response=response)

    valid_carts = [cart for cart in carts or [] if isinstance(cart, dict)]
    cart = next((value for value in valid_carts if value.get("items")), None)
    if cart is None:
        response = ZephyrosResponse.model_validate(
            {"blocks": [{"type": "text", "content": "Ваш кошик уже порожній."}]}
        )
        return PreparedReadContext(intent=intent, direct_response=response)

    try:
        cart_id = str(uuid.UUID(str(cart.get("id"))))
    except (TypeError, ValueError, AttributeError):
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Кошик повернув некоректний ідентифікатор.",
                        "suggestion": "Відкрийте кошик вручну та повторіть дію пізніше.",
                    }
                ]
            }
        )
        return PreparedReadContext(intent=intent, direct_response=response)
    if clear:
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "text",
                        "content": f"У кошику {len(cart.get('items') or [])} позицій. Очищення потребує підтвердження.",
                    },
                    {
                        "type": "action_button",
                        "label": "Очистити кошик",
                        "action": "clear_cart",
                        "payload": {"cart_id": cart_id},
                    },
                ]
            }
        )
        return PreparedReadContext(intent=intent, data={"cart_id": cart_id}, direct_response=response)

    items = [item for item in cart.get("items") or [] if isinstance(item, dict)]
    referenced = _select_history_product(message, history)
    referenced_id = int(referenced["product_id"]) if referenced is not None else None
    ignored = {
        "видали", "видалити", "удали", "убери", "remove", "це", "цей", "этот", "это",
        "товар", "продукт", "з", "із", "из", "кошика", "корзины", "корзину", "кошик",
    }
    tokens = {
        token
        for token in re.findall(r"[a-zа-яіїєґ0-9]+", message.casefold())
        if len(token) > 2 and token not in ignored
    }

    def item_score(item: dict[str, Any]) -> int:
        name = str(item.get("product_name") or "").casefold()
        score = sum(token in name for token in tokens)
        if referenced_id is not None and item.get("product_id") == referenced_id:
            score += 10
        return score

    ranked = sorted(items, key=item_score, reverse=True)
    selected = ranked[0] if ranked and (item_score(ranked[0]) > 0 or len(ranked) == 1) else None
    if selected is None:
        options = [
            f"Видали {str(item.get('product_name') or 'товар')} з кошика"
            for item in items[:4]
        ]
        if len(options) < 2:
            options.append("Відкрити мій кошик")
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "clarification",
                        "question": "Яку позицію видалити?",
                        "options": options,
                    }
                ]
            }
        )
        return PreparedReadContext(intent=intent, data={"cart_id": cart_id}, direct_response=response)

    name = str(selected.get("product_name") or "Товар")
    try:
        item_id = str(uuid.UUID(str(selected.get("id"))))
    except (TypeError, ValueError, AttributeError):
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "fallback",
                        "message": "Позиція кошика має некоректний ідентифікатор.",
                        "suggestion": "Відкрийте кошик і видаліть товар вручну.",
                    }
                ]
            }
        )
        return PreparedReadContext(intent=intent, direct_response=response)
    response = ZephyrosResponse.model_validate(
        {
            "blocks": [
                {"type": "text", "content": f"Готовий видалити «{name}» з кошика."},
                {
                    "type": "action_button",
                    "label": f"Видалити «{name[:48]}»",
                    "action": "remove_from_cart",
                    "payload": {
                        "cart_id": cart_id,
                        "item_id": item_id,
                        "product_id": selected.get("product_id"),
                    },
                },
            ]
        }
    )
    return PreparedReadContext(intent=intent, data={"cart_id": cart_id}, direct_response=response)
