from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Literal

from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from app.tools import (
    _prepare_cart,
    _prepare_catalog,
    _prepare_add_to_cart,
    _prepare_cart_mutation,
)


ContextIntent = Literal[
    "none",
    "catalog_search",
    "cart_view",
    "cart_comparison",
    "cart_add",
    "cart_remove",
    "cart_clear",
]


@dataclass(frozen=True)
class CatalogQuery:
    query: str
    price_min: float | None = None
    price_max: float | None = None
    sort: str | None = None

    @property
    def label(self) -> str:
        parts = [self.query]
        if self.price_min is not None and self.price_max is not None:
            parts.append(f"від {self.price_min:g} до {self.price_max:g} грн")
        elif self.price_min is not None:
            parts.append(f"від {self.price_min:g} грн")
        elif self.price_max is not None:
            parts.append(f"до {self.price_max:g} грн")
        return " · ".join(parts)


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
_ADD_WORDS = ("додай", "додати", "добав", "поклади", "положи", "add ")
_REMOVE_WORDS = ("видали", "видалити", "удали", "убери", "remove")
_CLEAR_WORDS = ("очисти", "очистити", "очисть", "clear")
_BROADEN_MESSAGES = (
    "показати всі магазини",
    "показать все магазины",
    "всі магазини",
    "все магазины",
    "прибрати бренд",
    "убрать бренд",
)
_AFFIRMATIONS = ("так", "да", "ага", "звісно", "конечно")
_NON_SEARCH_MESSAGES = (
    "привіт",
    "привет",
    "hello",
    "hi",
    "дякую",
    "спасибо",
    "thank",
    "хто ти",
    "кто ты",
    "що ти вмієш",
    "что ты умеешь",
    "як справи",
    "як твої справи",
    "як в тебе справи",
    "как дела",
    "как твои дела",
    "как у тебя дела",
    "how are you",
    "whats up",
    "what's up",
    "добридень",
    "добрий день",
    "доброго дня",
    "добрий вечір",
    "доброе утро",
    "здравствуйте",
    "вітаю",
    "приветствую",
    "до побачення",
    "до свидания",
    "бувай",
    "пока",
    "дякую",
    "дякую тобі",
)

_GEOPOLITICAL_KEYWORDS = (
    "крим",
    "росія",
    "россия",
    "рф",
    "російськ",
    "российск",
    "руські",
    "русские",
    "русский",
)


def classify_intent(message: str) -> ContextIntent:
    normalized = " ".join(message.casefold().split())
    if normalized.strip(".! ").strip() == "67":
        return "none"
    if any(word in normalized for word in _GEOPOLITICAL_KEYWORDS):
        return "none"
    if any(word in normalized for word in _CLEAR_WORDS):
        return "cart_clear"
    if any(word in normalized for word in _REMOVE_WORDS):
        return "cart_remove"
    if any(word in normalized for word in _ADD_WORDS):
        return "cart_add"
    has_cart = any(word in normalized for word in _CART_WORDS)
    if has_cart and any(word in normalized for word in _COMPARE_WORDS):
        return "cart_comparison"
    if has_cart and not any(word in normalized for word in _MUTATION_WORDS):
        return "cart_view"
    if any(re.search(rf"\b{re.escape(phrase)}\b", normalized) for phrase in _NON_SEARCH_MESSAGES):
        return "none"
    if normalized in _AFFIRMATIONS:
        return "none"
    return "catalog_search"


def _history_entries(history: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    return [entry for entry in history or [] if isinstance(entry, dict)]


def _previous_user_query(history: list[dict[str, Any]] | None) -> str | None:
    for entry in reversed(_history_entries(history)):
        if entry.get("role") != "user" or not isinstance(entry.get("content"), str):
            continue
        content = " ".join(entry["content"].split())
        if content and classify_intent(content) in {"catalog_search", "cart_add"}:
            return content
    return None


def _history_products(history: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """Return recent structured product references, newest first."""

    products: list[dict[str, Any]] = []
    seen: set[int] = set()
    for entry in reversed(_history_entries(history)):
        if entry.get("role") != "assistant":
            continue
        content = entry.get("content")
        if not isinstance(content, dict):
            continue
        blocks = content.get("blocks")
        if not isinstance(blocks, list):
            continue
        for block in reversed(blocks):
            if not isinstance(block, dict) or block.get("type") != "product_card":
                continue
            raw_product_id = block.get("product_id")
            if raw_product_id is None:
                continue
            try:
                product_id = int(raw_product_id)
            except (TypeError, ValueError):
                continue
            if product_id in seen:
                continue
            seen.add(product_id)
            products.append(block)
    return products


def _select_history_product(
    message: str,
    history: list[dict[str, Any]] | None,
) -> dict[str, Any] | None:
    products = _history_products(history)
    if not products:
        return None
    normalized = message.casefold()
    ignored = {
        "додай", "додати", "добав", "добавь", "поклади", "положи", "це", "цей",
        "цю", "этот", "это", "эту", "його", "его", "її", "ее", "до", "в", "у",
        "кошик", "кошика", "корзину", "корзины", "товар", "продукт", "будь", "ласка",
    }
    tokens = {
        token
        for token in re.findall(r"[a-zа-яіїєґ0-9]+", normalized)
        if len(token) > 2 and token not in ignored
    }
    if tokens:
        ranked = sorted(
            products,
            key=lambda product: sum(
                token in str(product.get("name") or "").casefold() for token in tokens
            ),
            reverse=True,
        )
        best_score = sum(
            token in str(ranked[0].get("name") or "").casefold() for token in tokens
        )
        if best_score:
            return ranked[0]
    return products[0]



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



def _catalog_product_response(
    query: str,
    hits: list[dict[str, Any]],
    *,
    add_requested: bool = False,
    query_label: str | None = None,
) -> ZephyrosResponse:
    """Render catalog facts deterministically and pair every product with a cart action."""

    blocks: list[dict[str, Any]] = [
        {
            "type": "text",
            "content": (
                "Знайшов товар. Підтвердьте додавання кнопкою нижче."
                if add_requested and len(hits) == 1
                else f"Знайшов актуальні пропозиції за запитом «{(query_label or query)[:120]}»."
            ),
        }
    ]
    for product in hits[:5]:
        offers = [
            offer
            for offer in product.get("offers") or []
            if isinstance(offer, dict) and offer.get("in_stock", False)
        ]
        def offer_sort_key(offer: dict[str, Any]) -> float:
            raw_offer_price = offer.get("price")
            if raw_offer_price is None:
                return float("inf")
            try:
                return float(raw_offer_price)
            except (TypeError, ValueError):
                return float("inf")

        offers.sort(key=offer_sort_key)
        offer = offers[0] if offers else {}
        raw_price = offer.get("price", product.get("price"))
        if raw_price is None:
            price = 0.0
        else:
            try:
                price = float(raw_price)
            except (TypeError, ValueError):
                price = 0.0
        product_id = int(product["id"])
        name = str(product.get("title") or "Товар")
        store = str(offer.get("store") or product.get("store") or "Магазин не вказано")
        blocks.extend(
            [
                {
                    "type": "product_card",
                    "product_id": product_id,
                    "name": name,
                    "store": store,
                    "price": f"{price:.2f} ₴" if price > 0 else "Ціна уточнюється",
                    "in_stock": bool(offer.get("in_stock", product.get("in_stock", True))),
                    "image_url": product.get("image_url"),
                },
                {
                    "type": "action_button",
                    "label": f"Додати «{name[:48]}» до кошика",
                    "action": "add_to_cart",
                    "payload": {
                        "product_id": product_id,
                        "quantity": 1,
                        "store_id": offer.get("store_id"),
                    },
                },
            ]
        )
    return ZephyrosResponse.model_validate({"blocks": blocks})


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


_PRICE_CURRENCY = r"(?:грн\.?|грив(?:ня|ні|ень)?|₴)?"
_PRICE_NUMBER = r"(\d+(?:[.,]\d{1,2})?)"


def _parse_catalog_query(message: str) -> CatalogQuery:
    normalized = " ".join(message.casefold().split())
    price_min: float | None = None
    price_max: float | None = None

    def number(value: str) -> float:
        return float(value.replace(",", "."))

    between_pattern = re.compile(
        rf"\b(?:від|от)\s*{_PRICE_NUMBER}\s*{_PRICE_CURRENCY}\s*(?:до|по|[-–—])\s*"
        rf"{_PRICE_NUMBER}\s*{_PRICE_CURRENCY}",
        flags=re.IGNORECASE,
    )
    between = between_pattern.search(normalized)
    if between:
        price_min, price_max = sorted((number(between.group(1)), number(between.group(2))))
        normalized = between_pattern.sub(" ", normalized)

    max_pattern = re.compile(
        rf"\b(?:до|не\s+дорожче|не\s+дороже|максимум|не\s+більше|не\s+больше|under)"
        rf"\s*{_PRICE_NUMBER}\s*{_PRICE_CURRENCY}",
        flags=re.IGNORECASE,
    )
    maximum = max_pattern.search(normalized)
    if maximum:
        price_max = number(maximum.group(1))
        normalized = max_pattern.sub(" ", normalized)

    min_pattern = re.compile(
        rf"\b(?:від|от|не\s+дешевше|не\s+дешевле|мінімум|минимум|over)"
        rf"\s*{_PRICE_NUMBER}\s*{_PRICE_CURRENCY}",
        flags=re.IGNORECASE,
    )
    minimum = min_pattern.search(normalized)
    if minimum:
        price_min = number(minimum.group(1))
        normalized = min_pattern.sub(" ", normalized)

    cheapest_requested = bool(
        re.search(
            r"\b(найвигідніш\w*|сам(?:ий|ая|ое)\s+выгодн\w*|найдешевш\w*|"
            r"сам(?:ий|ая|ое)\s+дешев\w*|дешев(?:ий|а|е|і|ый|ая|ое|ые))\b",
            normalized,
            flags=re.IGNORECASE,
        )
    )
    query = re.sub(
        r"\b(знайди|знайти|найди|найти|покажи|показати|показать|порівняй|порівняти|"
        r"сравни|сравнить|ціни?\s+на|цены?\s+на|найвигідніш\w*|выгодн\w*|"
        r"найдешевш\w*|дешев\w*|додай|додати|добавь?|добавить|поклади|положи)\b",
        " ",
        normalized,
        flags=re.IGNORECASE,
    )
    query = re.sub(
        r"\b(це|цей|цю|это|этот|эту|товар|продукт|до\s+кошика|в\s+корзину|у\s+кошик)\b",
        " ",
        query,
        flags=re.IGNORECASE,
    )
    query = re.sub(r"\b(?:грн\.?|грив(?:ня|ні|ень)?)\b|₴", " ", query)
    clean_query = " ".join(query.split()) or message.strip()
    return CatalogQuery(
        query=clean_query,
        price_min=price_min if price_min is None or price_min >= 0 else None,
        price_max=price_max if price_max is None or price_max > 0 else None,
        sort="price:asc" if cheapest_requested else None,
    )


def _catalog_query(message: str) -> str:
    return _parse_catalog_query(message).query



async def build_read_context(
    message: str,
    deps: AgentDeps,
    *,
    request_id: str,
    history: list[dict[str, Any]] | None = None,
) -> PreparedReadContext:
    normalized = " ".join(message.casefold().split())

    if normalized.strip(".! ").strip() == "67":
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {"type": "text", "content": "СІКС СЕВЕНННННННННННН 🎉"}
                ]
            }
        )
        return PreparedReadContext(intent="none", direct_response=response)

    if "крим" in normalized:
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {"type": "text", "content": "Крим — це Україна!\n\nСлава Україні!"}
                ]
            }
        )
        return PreparedReadContext(intent="none", direct_response=response)

    if any(k in normalized for k in ("росі", "росс", "рф", "россия", "росія", "русск", "руськ")):
        response = ZephyrosResponse.model_validate(
            {
                "blocks": [
                    {"type": "text", "content": "Росія — це країна-терорист. Росії не повинно існувати.\n\nСлава Україні!"}
                ]
            }
        )
        return PreparedReadContext(intent="none", direct_response=response)

    if normalized in _BROADEN_MESSAGES or normalized in _AFFIRMATIONS:
        previous = _previous_user_query(history)
        if previous:
            message = _catalog_query(previous)
        elif normalized in _BROADEN_MESSAGES:
            response = ZephyrosResponse.model_validate(
                {
                    "blocks": [
                        {"type": "text", "content": "Відкриваю список усіх магазинів."},
                        {
                            "type": "action_button",
                            "label": "Показати всі магазини",
                            "action": "navigate",
                            "payload": {"route": "/shops"},
                        },
                    ]
                }
            )
            return PreparedReadContext(intent="none", direct_response=response)
    intent = classify_intent(message)
    if intent == "catalog_search":
        semantic_intent = await _classify_intent_semantically(message, deps)
        if semantic_intent == "none":
            intent = "none"
    if intent == "cart_comparison":
        return await _prepare_cart(deps, compare=True, request_id=request_id)
    if intent == "cart_view":
        return await _prepare_cart(deps, compare=False, request_id=request_id)
    if intent == "cart_add":
        return await _prepare_add_to_cart(message, deps, request_id, history)
    if intent == "cart_remove":
        return await _prepare_cart_mutation(
            message,
            deps,
            clear=False,
            request_id=request_id,
            history=history,
        )
    if intent == "cart_clear":
        return await _prepare_cart_mutation(
            message,
            deps,
            clear=True,
            request_id=request_id,
            history=history,
        )
    if intent == "catalog_search":
        return await _prepare_catalog(message, deps, request_id)
    return PreparedReadContext(intent="none")


def _is_simple_search_query(message: str) -> bool:
    normalized = " ".join(message.casefold().split())
    help_markers = {
        "як", "де", "хто", "що", "чому", "help", "якщо", "інструкц",
        "правил", "умеешь", "вмієш", "доставк", "оплат", "акці",
        "скидк", "магазин", "кошик", "корзин"
    }
    if any(marker in normalized for marker in help_markers):
        return False
    words = [w for w in re.findall(r"[a-zа-яіїєґ0-9]+", normalized)]
    if len(words) <= 2 and "?" not in message:
        return True
    return False


async def _classify_intent_semantically(message: str, deps: AgentDeps) -> ContextIntent:
    from app.config import settings
    if not settings.INTENT_CLASSIFIER_ENABLED:
        return "catalog_search"

    if _is_simple_search_query(message):
        return "catalog_search"

    normalized = " ".join(message.casefold().split())
    import hashlib
    h = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    cache_key = f"zephyros:intent-cache:{h}"

    from loguru import logger

    # Check cache
    if deps.redis_client:
        try:
            cached = await deps.redis_client.get(cache_key)
            if cached in (b"catalog_search", b"none", "catalog_search", "none"):
                val = cached.decode("utf-8") if isinstance(cached, bytes) else cached
                logger.bind(query=message, intent=val, source="cache").info("Semantic intent cache hit")
                return val
        except Exception as error:
            logger.bind(error=str(error)).warning("Semantic intent cache read failed")

    # Call zero-shot classifier
    from pydantic_ai import Agent
    from app.agent.zephyros import available_provider_chain, build_model
    import asyncio

    candidates = available_provider_chain()
    if not candidates:
        return "catalog_search"

    provider = candidates[0]
    logger.bind(query=message, provider=provider).info("Running semantic intent classifier LLM request")

    try:
        classifier_model = build_model(provider)
        classifier_agent = Agent(classifier_model, system_prompt=settings.INTENT_CLASSIFIER_PROMPT)

        result = await asyncio.wait_for(
            classifier_agent.run(message, model_settings={"max_tokens": 5}),
            timeout=settings.INTENT_CLASSIFIER_TIMEOUT_SECONDS,
        )

        output = ""
        if hasattr(result, "data"):
            output = str(result.data)
        elif hasattr(result, "output"):
            output = str(result.output)

        output = output.strip().lower()

        if "none" in output:
            intent = "none"
        else:
            intent = "catalog_search"

        logger.bind(query=message, provider=provider, raw_output=output, resolved_intent=intent).info("Semantic intent classifier resolved")

        # Set cache
        if deps.redis_client:
            try:
                await deps.redis_client.set(
                    cache_key,
                    intent,
                    ex=settings.INTENT_CLASSIFIER_CACHE_TTL_SECONDS,
                )
            except Exception as error:
                logger.bind(error=str(error)).warning("Semantic intent cache write failed")

        return intent
    except Exception as error:
        logger.bind(query=message, error=repr(error)).warning("Semantic intent classifier failed, defaulting to catalog_search")
        return "catalog_search"
