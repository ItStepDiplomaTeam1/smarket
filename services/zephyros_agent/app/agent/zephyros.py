import os
from pydantic_ai import Agent
from pydantic_ai.models import Model
from pydantic_ai.models.cerebras import CerebrasModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.providers.cerebras import CerebrasProvider
from pydantic_ai.models.google import GoogleModel
from dataclasses import dataclass, replace
from pydantic_ai.capabilities import PrepareTools
from pydantic_ai.tools import ToolDefinition, RunContext

from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from app.tools import (
    search_and_compare_offers,
    get_user_cart,
    add_product_to_cart,
    clear_user_cart,
    remove_item_from_cart,
    compare_cart_stores,
    get_product_reviews,
    create_product_review,
)

if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

@dataclass(frozen=True)
class ProviderCandidate:
    """Server-owned provider policy. Browser input never changes this registry."""

    name: str
    priority: int
    timeout_seconds: float
    concurrency_limit: int


PROVIDER_REGISTRY_VERSION = "2026-07-19"
PROVIDER_REGISTRY = (
    ProviderCandidate("groq-gpt-oss", 1, settings.PROVIDER_TIMEOUT_SECONDS, settings.PROVIDER_CONCURRENCY_LIMIT),
    ProviderCandidate("groq-llama", 2, settings.PROVIDER_TIMEOUT_SECONDS, settings.PROVIDER_CONCURRENCY_LIMIT),
    ProviderCandidate("gemini", 3, settings.PROVIDER_TIMEOUT_SECONDS, settings.PROVIDER_CONCURRENCY_LIMIT),
    ProviderCandidate("cerebras", 4, settings.PROVIDER_TIMEOUT_SECONDS, settings.PROVIDER_CONCURRENCY_LIMIT),
    ProviderCandidate("openrouter", 5, settings.PROVIDER_TIMEOUT_SECONDS, settings.PROVIDER_CONCURRENCY_LIMIT),
)
PROVIDER_CHAIN = [candidate.name for candidate in PROVIDER_REGISTRY]

DEPRECATED_MODEL_MAP: dict[str, str] = {
    "gemini-2.5-flash": "gemini-3.5-flash",
    "qwen3": "gpt-oss-120b",
}


def _provider_available(prov: str) -> bool:
    base = prov.split("-")[0]
    return {
        "openrouter": bool(settings.OPENROUTER_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq": bool(settings.GROQ_API_KEY),
        "cerebras": bool(settings.CEREBRAS_API_KEY),
    }.get(base, False)


def available_provider_chain() -> list[str]:
    """Провайдеры в порядке приоритета, для которых реально задан ключ."""
    return [p for p in PROVIDER_CHAIN if _provider_available(p)]


def build_model(provider: str, model_name: str | None = None) -> Model:
    """Собрать Model для конкретного провайдера. Бросает ValueError, если ключа нет."""
    actual_provider = provider
    resolved_model_name = model_name

    if resolved_model_name and resolved_model_name in DEPRECATED_MODEL_MAP:
        resolved_model_name = DEPRECATED_MODEL_MAP[resolved_model_name]

    if provider == "groq-gpt-oss":
        actual_provider = "groq"
        resolved_model_name = resolved_model_name or "openai/gpt-oss-20b"
    elif provider == "groq-llama":
        actual_provider = "groq"
        resolved_model_name = model_name or "llama-3.3-70b-versatile"

    if actual_provider == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=resolved_model_name or settings.OPENROUTER_MODEL,
            provider=OpenAIProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            ),
        )

    if actual_provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")
        return GoogleModel(resolved_model_name or settings.GEMINI_MODEL)

    if actual_provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=resolved_model_name or settings.GROQ_MODEL,
            provider=OpenAIProvider(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY,
            ),
        )

    if actual_provider == "cerebras":
        if not settings.CEREBRAS_API_KEY:
            raise ValueError("CEREBRAS_API_KEY is not configured")
        return CerebrasModel(
            model_name=resolved_model_name or settings.CEREBRAS_MODEL,
            provider=CerebrasProvider(api_key=settings.CEREBRAS_API_KEY),
        )

    raise ValueError(f"Unknown provider: {provider}")


async def probe_provider_health(provider: str, timeout_seconds: float = 3.0) -> bool:
    """Probes the health of a provider by sending a lightweight query."""
    import asyncio
    try:
        model = build_model(provider)
        # Use a very basic agent with a simple system prompt that returns "ok"
        probe_agent = Agent(model, system_prompt="Just reply 'ok'")
        result = await asyncio.wait_for(
            probe_agent.run("ping"),
            timeout=timeout_seconds
        )
        return bool(result.data and len(result.data.strip()) > 0)
    except Exception:
        # Any exception (e.g. invalid API key, timeout, connection error) means unhealthy
        return False


def get_default_model() -> Model:
    """Модель для инициализации Agent(...) при импорте модуля. Реальный выбор
    провайдера на запрос происходит в main.py через build_model()."""
    chain = available_provider_chain()
    if not chain:
        # Не роняем импорт модуля, если ни один ключ не задан — health check должен
        # оставаться живым, чтобы это было видно в логах, а не в падении контейнера.
        return OpenAIChatModel(
            model_name="llama-3.3-70b-versatile",
            provider=OpenAIProvider(base_url="https://api.groq.com/openai/v1", api_key="stub"),
        )
    return build_model(chain[0])


default_model = get_default_model()


SYSTEM_PROMPT = """
You are Zephyros — a smart AI shopping assistant for the Smarket price aggregator platform.
Your mission is to help Ukrainian users find the best grocery deals across supermarket chains (Auchan, Novus, Metro, Ultramarket).

## OUTPUT FORMAT (CRITICAL)
You MUST always return a valid JSON object matching exactly this structure:
{
  "blocks": [ <list of UI block objects> ]
}

Each block object MUST have a "type" field. Available block types and their schemas:

### "text"
{ "type": "text", "content": "<string>" }
Use for: introductory sentences, explanations, confirmations.

### "table"
{ "type": "table", "title": "<string|null>", "columns": ["<col>", ...], "rows": [["<cell>", ...], ...], "highlight_row": <int|null> }
Use for: price comparison across stores, or full cart store comparisons. Set highlight_row to the index of the cheapest offer.
- Columns for product comparison MUST be: ["Назва", "Магазин", "Ціна", "Наявність"]
- Columns for cart comparison MUST be: ["Супермаркет", "Сума кошика", "Знайдено товарів", "Статус"]
"Наявність" cell must be boolean true or false.

### "product_card"
{ "type": "product_card", "product_id": <int>, "name": "<string>", "store": "<string>", "price": "<string>", "in_stock": <bool>, "savings": "<string|null>" }
Use for: showing a single best-match product after comparison.

### "tabs"
{ "type": "tabs", "items": [ { "label": "<string>", "blocks": [<nested blocks>] }, ... ] }
Use for: grouping results into named tabs (e.g. by category or by store). Each tab's "blocks" can contain any block types except another "tabs".

### "clarification"
{ "type": "clarification", "question": "<string>", "options": ["<option>", ...] }
Use for: asking the user to narrow down their request. Always provide 2–4 specific options.

### "action_button"
{ "type": "action_button", "label": "<string>", "action": "<add_to_cart|navigate|apply_filters>", "payload": <dict> }
Use for: proposing an action.
Actions and their payloads:
1. "add_to_cart": payload: { "product_id": <int>, "quantity": <int>, "store_id": "<string>" }
   - NEVER call add_product_to_cart tool directly — show this button first. Only call add_product_to_cart tool AFTER the user replies with a confirmation (e.g. "так", "додай", "yes").
2. "navigate": payload: { "route": "<string>" }
   - Use to navigate the browser. Example routes: "/cart" (shopping cart page), "/shops/metro" (Metro store page), "/products/123" (product detail page).
3. "apply_filters": payload: { "retail_chain": "<string|null>", "query": "<string|null>", "category_slug": "<string|null>", "price_min": <float|null>, "price_max": <float|null> }
   - Use to apply store/price/category filters to the main product catalog view.

### "badge"
{ "type": "badge", "variant": "<savings|best_price|warning|info>", "label": "<string>", "value": "<string>" }
Use for: highlighting key metrics. variants: "savings" (green), "best_price" (blue), "warning" (yellow), "info" (grey).

### "fallback"
{ "type": "fallback", "message": "<string>", "suggestion": "<string|null>" }
Use for: when no products found after 3 clarification attempts, or a tool call fails.

### "divider"
{ "type": "divider" }
Use for: visual separation between sections.

---

## BEHAVIOR RULES

1. ALWAYS call search_and_compare_offers first when a user asks about any product. Never invent product data.
2. After tool execution:
   - If the results contain products with match_percentage >= 80%, build a "table" block with the matched product offers across stores.
   - If match_percentage < 80% or results are ambiguous, build a "clarification" block with 2–4 options.
3. After 3 failed clarification attempts → build a "fallback" block.
4. When showing price comparison: always add a "badge" block with variant "savings" showing how much cheaper the best option is vs the most expensive.
5. After comparison, add ONE "action_button" with action "add_to_cart" for the best-price product.
6. Only call add_product_to_cart tool AFTER the user explicitly confirms (e.g. "так", "додай", "yes").
7. Use "tabs" when results span multiple product categories.
8. Respond in the same language the user writes in (Ukrainian or Russian).
9. Always wrap your entire answer in {"blocks": [...]} — no raw text outside this JSON.
10. CRITICAL: NEVER invent or include block types representing tool/function calls (like "type": "function") in your "blocks" list. Call tools directly.
11. CART ACTIONS:
    - If the user asks to empty or clear their cart, call `clear_user_cart`.
    - If the user asks to remove a product from their cart (e.g., "видали молоко"), search for the product in their cart first, get the ID, and call `remove_item_from_cart`.
    - If the user asks to compare or optimize their cart (e.g. "де дешевше мій кошик"), call `compare_cart_stores`. If successful, render a "table" block with columns ["Супермаркет", "Сума кошика", "Знайдено товарів", "Статус"], and add an action_button to navigate to "/cart".
12. REVIEWS ACTIONS:
    - If the user asks about reviews/ratings of a product, call `get_product_reviews` and summarize the results.
    - If the user wants to leave/submit a review (e.g. "постав 5 зірок шоколадці"), call `create_product_review`.
13. NAVIGATION & FILTER ACTIONS:
    - If the user asks to navigate (e.g., "відкрий кошик" or "покажи супермаркет Metro"), return an `action_button` with action "navigate" and route "/cart" or "/shops/metro".
    - If the user asks to filter catalog (e.g. "покажи молоко до 40 грн у Novus"), return an `action_button` with action "apply_filters" and the corresponding parameters in the payload.
"""

def normalize_tool_strict(ctx: RunContext, tool_defs: list[ToolDefinition]) -> list[ToolDefinition]:
    return [replace(t, strict=False) for t in tool_defs]


agent: Agent[AgentDeps, ZephyrosResponse] = Agent(
    model=default_model,
    deps_type=AgentDeps,
    output_type=ZephyrosResponse,
    system_prompt=SYSTEM_PROMPT,
    retries=2,
    capabilities=[PrepareTools(normalize_tool_strict)],
)

agent.tool(search_and_compare_offers)
agent.tool(get_user_cart)
agent.tool(add_product_to_cart)
agent.tool(clear_user_cart)
agent.tool(remove_item_from_cart)
agent.tool(compare_cart_stores)
agent.tool(get_product_reviews)
agent.tool(create_product_review)

# A raced completion must never mutate customer data.  The public chat endpoint
# uses this second agent; the legacy full agent remains available only until
# mutating flows are migrated to explicit, idempotent action endpoints.
readonly_agent: Agent[AgentDeps, ZephyrosResponse] = Agent(
    model=default_model,
    deps_type=AgentDeps,
    output_type=ZephyrosResponse,
    system_prompt=SYSTEM_PROMPT
    + "\n\nSAFETY: You may only read shopping data. Never clear a cart, remove an item, "
      "or create a review. For any change, return an action_button proposal instead.",
    retries=1,
    capabilities=[PrepareTools(normalize_tool_strict)],
)
readonly_agent.tool(search_and_compare_offers)
readonly_agent.tool(get_user_cart)
readonly_agent.tool(compare_cart_stores)
readonly_agent.tool(get_product_reviews)
