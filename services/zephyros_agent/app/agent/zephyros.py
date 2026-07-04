import os
from pydantic_ai import Agent
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.google import GoogleModel
from dataclasses import replace
from pydantic_ai.capabilities import PrepareTools
from pydantic_ai.tools import ToolDefinition, RunContext

from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from app.tools import (
    search_catalog,
    compare_product_offers,
    get_user_cart,
    add_product_to_cart,
)

if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

# Порядок провайдеров для автоматического перебора, если явный provider не передан
PROVIDER_CHAIN = ["openrouter", "gemini", "groq", "cerebras"]


def _provider_available(prov: str) -> bool:
    return {
        "openrouter": bool(settings.OPENROUTER_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq": bool(settings.GROQ_API_KEY),
        "cerebras": bool(settings.CEREBRAS_API_KEY),
    }.get(prov, False)


def available_provider_chain() -> list[str]:
    """Провайдеры в порядке приоритета, для которых реально задан ключ."""
    return [p for p in PROVIDER_CHAIN if _provider_available(p)]


def build_model(provider: str, model_name: str | None = None) -> Model:
    """Собрать Model для конкретного провайдера. Бросает ValueError, если ключа нет."""
    if provider == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=model_name or settings.OPENROUTER_MODEL,
            provider=OpenAIProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            ),
        )

    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")
        return GoogleModel(model_name or settings.GEMINI_MODEL)

    if provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=model_name or settings.GROQ_MODEL,
            provider=OpenAIProvider(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY,
            ),
        )

    if provider == "cerebras":
        if not settings.CEREBRAS_API_KEY:
            raise ValueError("CEREBRAS_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=model_name or settings.CEREBRAS_MODEL,
            provider=OpenAIProvider(
                base_url="https://api.cerebras.ai/v1",
                api_key=settings.CEREBRAS_API_KEY,
            ),
        )

    raise ValueError(f"Unknown provider: {provider}")


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
Use for: price comparison across stores. Set highlight_row to the index of the cheapest offer.
Columns for product comparison MUST be: ["Назва", "Магазин", "Ціна", "Наявність"]
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
{ "type": "action_button", "label": "<string>", "action": "add_to_cart", "payload": { "product_id": <int>, "quantity": <int>, "store_id": "<string>" } }
Use for: proposing an action. NEVER call add_product_to_cart tool directly — show this button first.
When the user replies with a confirmation (e.g. "так", "додай", "yes") — THEN call add_product_to_cart tool.

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

1. ALWAYS call search_catalog first when a user asks about any product. Never invent product data.
2. After search results:
   - match_percentage >= 80% → call compare_product_offers, then build a "table" block with results.
   - match_percentage < 80% → build a "clarification" block with 2–4 options.
3. After 3 failed clarification attempts → build a "fallback" block.
4. When showing price comparison: always add a "badge" block with variant "savings" showing how much cheaper the best option is vs the most expensive.
5. After comparison, add ONE "action_button" with action "add_to_cart" for the best-price product.
6. Only call add_product_to_cart tool AFTER the user explicitly confirms (e.g. "так", "додай", "yes").
7. Use "tabs" when results span multiple product categories.
8. Respond in the same language the user writes in (Ukrainian or Russian).
9. Always wrap your entire answer in {"blocks": [...]} — no raw text outside this JSON.
10. CRITICAL: NEVER invent or include block types representing tool/function calls (like "type": "function") in your "blocks" list. If you need to search, compare, or get the cart, call the corresponding tools directly. The JSON output blocks must only contain the allowed UI element types (text, table, product_card, tabs, clarification, action_button, badge, fallback, divider).
11. CRITICAL: NEVER output tool/function calls or return the final result wrapped in raw XML tags (like `<function=final_result>` or `<call:final_result>`) within your response text. When calling tools (like `final_result`), call them using the API's native function-calling parameter schemas.
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

agent.tool(search_catalog)
agent.tool(compare_product_offers)
agent.tool(get_user_cart)
agent.tool(add_product_to_cart)
