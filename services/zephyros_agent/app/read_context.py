from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import Any, Literal

import httpx
from loguru import logger

from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse


ContextIntent = Literal["none", "catalog_search", "cart_view", "cart_comparison"]


@dataclass(frozen=True)
class PreparedReadContext:
    """Canonical read-only data shared by every provider attempt."""

    intent: ContextIntent
    data: dict[str, Any] = field(default_factory=dict)
    direct_response: ZephyrosResponse | None = None
    allowed_product_ids: frozenset[int] = frozenset()
    degraded_response: ZephyrosResponse | None = None

    def render_prompt(self, message: str) -> str:
        if not self.data:
            return message
        compact = json.dumps(self.data, ensure_ascii=False, separators=(",", ":"))
        return (
            f"Запит покупця: {message}\n\n"
            "Перевірений read-only контекст Smarket наведено нижче. "
            "Використовуй тільки ці факти для цін, товарів і кошика; не викликай інструменти "
            "та не вигадуй відсутні значення.\n"
            f"<smarket_context intent=\"{self.intent}\">{compact}</smarket_context>"
        )


_CART_WORDS = ("кошик", "кошика", "корзин", "cart")
_COMPARE_WORDS = (
    "порівн",
    "сравн",
    "дешев",
    "вигід",
    "выгод",
    "оптим",
    "кращий магазин",
    "лучший магазин",
)
_MUTATION_WORDS = (
    "додай",
    "добав",
    "видали",
    "удали",
    "очист",
    "remove",
    "add ",
    "clear",
)
_NON_SEARCH_MESSAGES = (
    "привіт",
    "привет",
    "hello",
    "дякую",
    "спасибо",
    "хто ти",
    "кто ты",
    "що ти вмієш",
    "что ты умеешь",
)


def classify_intent(message: str) -> ContextIntent:
    normalized = " ".join(message.casefold().split())
    has_cart = any(word in normalized for word in _CART_WORDS)
    if has_cart and any(word in normalized for word in _COMPARE_WORDS):
        return "cart_comparison"
    if has_cart and not any(word in normalized for word in _MUTATION_WORDS):
        return "cart_view"
    if any(phrase in normalized for phrase in _NON_SEARCH_MESSAGES):
        return "none"
    return "catalog_search"


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


def _cart_snapshot_response(cart: dict[str, Any], *, comparison_failed: bool = False) -> ZephyrosResponse:
    items = cart.get("items") or []
    if not items:
        return ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {"type": "text", "content": "Ваш кошик поки порожній."},
                    {
                        "type": "action_button",
                        "label": "Перейти до каталогу",
                        "action": "navigate",
                        "payload": {"route": "/"},
                    },
                ]
            }
        )

    rows: list[list[str | bool | float | None]] = []
    for item in items[:12]:
        quantity = max(1, int(item.get("quantity") or 1))
        unit_price = float(item.get("price") or 0)
        rows.append(
            [
                str(item.get("product_name") or f"Товар #{item.get('product_id', '—')}"),
                str(quantity),
                f"{unit_price * quantity:.2f} ₴" if unit_price else "—",
            ]
        )

    blocks: list[dict[str, Any]] = []
    if comparison_failed:
        blocks.append(
            {
                "type": "fallback",
                "message": "Не вдалося оновити ціни всіх магазинів.",
                "suggestion": "Zephyros зберіг ваш кошик нижче — повторіть порівняння за кілька секунд.",
            }
        )
    else:
        blocks.append(
            {
                "type": "text",
                "content": f"У кошику {len(items)} позицій. Ось актуальний склад:",
            }
        )
    blocks.extend(
        [
            {
                "type": "table",
                "title": str(cart.get("name") or "Мій кошик"),
                "columns": ["Товар", "Кількість", "Сума"],
                "rows": rows,
            },
            {
                "type": "action_button",
                "label": "Відкрити кошик",
                "action": "navigate",
                "payload": {"route": "/cart"},
            },
        ]
    )
    return ZephyrosResponse.model_validate({"blocks": blocks})


def _cart_comparison_response(cart: dict[str, Any], comparison: Any) -> ZephyrosResponse:
    if not isinstance(comparison, list) or not comparison:
        return _cart_snapshot_response(cart, comparison_failed=True)

    item_count = len(cart.get("items") or [])
    valid_rows: list[dict[str, Any]] = []
    for row in comparison:
        if not isinstance(row, dict):
            continue
        try:
            total = float(row.get("total_price") or 0)
            found = int(row.get("found_items_count") or 0)
            missing = int(row.get("missing_items_count") or 0)
        except (TypeError, ValueError):
            continue
        if total < 0 or found < 0 or missing < 0:
            continue
        valid_rows.append({**row, "total_price": total, "found": found, "missing": missing})

    if not valid_rows:
        return _cart_snapshot_response(cart, comparison_failed=True)

    valid_rows.sort(
        key=lambda row: (
            not bool(row.get("is_complete")),
            row["missing"],
            row["total_price"],
            str(row.get("store_name") or row.get("retail_chain") or ""),
        )
    )
    shown = valid_rows[:8]
    rows = [
        [
            str(row.get("store_name") or row.get("retail_chain") or "Магазин"),
            f"{row['total_price']:.2f} ₴",
            f"{row['found']}/{item_count}",
            "Усе є" if row.get("is_complete") else f"Немає: {row['missing']}",
        ]
        for row in shown
    ]

    complete = [row for row in valid_rows if row.get("is_complete")]
    blocks: list[dict[str, Any]] = [
        {
            "type": "text",
            "content": "Порівняння готове. Першим показано найкращий повний варіант кошика.",
        },
        {
            "type": "table",
            "title": "Вартість кошика за магазинами",
            "columns": ["Супермаркет", "Сума кошика", "Знайдено", "Статус"],
            "rows": rows,
            "highlight_row": 0,
        },
    ]
    if len(complete) > 1:
        saving = max(row["total_price"] for row in complete) - min(
            row["total_price"] for row in complete
        )
        if saving > 0:
            blocks.append(
                {
                    "type": "badge",
                    "variant": "savings",
                    "label": "Можлива економія",
                    "value": f"{saving:.2f} ₴",
                }
            )
    blocks.append(
        {
            "type": "action_button",
            "label": "Переглянути кошик",
            "action": "navigate",
            "payload": {"route": "/cart"},
        }
    )
    return ZephyrosResponse.model_validate({"blocks": blocks})


async def _prepare_cart(
    deps: AgentDeps,
    *,
    compare: bool,
    request_id: str,
) -> PreparedReadContext:
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
        "offers": compact_offers[:8],
    }


def _catalog_degraded_response(
    query: str,
    hits: list[dict[str, Any]],
) -> ZephyrosResponse:
    display_query = query[:120]

    def offer_price(offer: dict[str, Any]) -> float:
        raw_price = offer.get("price")
        if raw_price is None:
            return float("inf")
        try:
            return float(raw_price)
        except (TypeError, ValueError):
            return float("inf")

    priced_rows: list[tuple[float, list[str | bool | float | None]]] = []
    for product in hits:
        available_offers = [
            offer
            for offer in product.get("offers") or []
            if isinstance(offer, dict) and offer.get("in_stock", False)
        ]
        available_offers.sort(key=offer_price)
        offer = available_offers[0] if available_offers else {}
        raw_price = offer.get("price") or product.get("price")
        if raw_price is None:
            price = float("inf")
        else:
            try:
                price = float(raw_price)
            except (TypeError, ValueError):
                price = float("inf")
        price_label = f"{price:.2f} ₴" if price != float("inf") else "—"
        priced_rows.append(
            (
                price,
                [
                    str(product.get("title") or "Товар"),
                    str(offer.get("store") or product.get("store") or "—"),
                    price_label,
                    bool(offer.get("in_stock", product.get("in_stock", True))),
                ],
            )
        )
    priced_rows.sort(key=lambda item: (item[0], str(item[1][0])))
    rows = [row for _price, row in priced_rows[:8]]
    return ZephyrosResponse.model_validate(
        {
            "blocks": [
                {
                    "type": "fallback",
                    "message": "Zephyros показує перевірені дані каталогу без AI-оформлення.",
                    "suggestion": "Результати актуальні; повторіть запит, щоб отримати розширену пораду.",
                },
                {
                    "type": "table",
                    "title": f"Результати: {display_query}",
                    "columns": ["Товар", "Магазин", "Ціна", "Наявність"],
                    "rows": rows,
                    "highlight_row": 0 if rows else None,
                },
                {
                    "type": "action_button",
                    "label": "Відкрити результати в каталозі",
                    "action": "apply_filters",
                    "payload": {"query": query},
                },
            ]
        }
    )


async def _prepare_catalog(message: str, deps: AgentDeps, request_id: str) -> PreparedReadContext:
    normalized = message.casefold()
    deals_request = any(
        phrase in normalized
        for phrase in ("вигідні пропозиції", "акційні", "акции", "акції", "знижки", "скидки")
    )
    query = re.sub(
        r"\b(знайди|знайти|найди|найти|покажи|показати|показать|порівняй|порівняти|сравни|сравнить|ціни?\s+на|цены?\s+на|дешевший|дешевше)\b",
        " ",
        normalized,
        flags=re.IGNORECASE,
    )
    query = " ".join(query.split()) or message.strip()
    search_params: dict[str, Any] = {
        "q": "" if deals_request else query,
        "in_stock": "true",
        "limit": 8,
    }
    if deals_request:
        search_params.update({"offer_type": "promo", "sort": "discount_percent:desc"})
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
            intent="catalog_search",
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

    data = {"query": query, "products": hits, "total": search_mapping.get("total_hits")}
    if not hits:
        direct = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {
                        "type": "text",
                        "content": f"За запитом «{query}» актуальних товарів не знайдено.",
                    },
                    {
                        "type": "clarification",
                        "question": "Спробуємо ширший запит?",
                        "options": ["Прибрати бренд", "Показати всі магазини"],
                    },
                ]
            }
        )
        return PreparedReadContext(intent="catalog_search", data=data, direct_response=direct)

    return PreparedReadContext(
        intent="catalog_search",
        data=data,
        allowed_product_ids=frozenset(allowed_ids),
        degraded_response=_catalog_degraded_response(query, hits),
    )


async def build_read_context(
    message: str,
    deps: AgentDeps,
    *,
    request_id: str,
) -> PreparedReadContext:
    intent = classify_intent(message)
    if intent == "cart_comparison":
        return await _prepare_cart(deps, compare=True, request_id=request_id)
    if intent == "cart_view":
        return await _prepare_cart(deps, compare=False, request_id=request_id)
    if intent == "catalog_search":
        return await _prepare_catalog(message, deps, request_id)
    return PreparedReadContext(intent="none")
