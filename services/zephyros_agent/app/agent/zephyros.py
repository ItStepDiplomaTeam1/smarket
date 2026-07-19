import os
from dataclasses import dataclass

from pydantic_ai import Agent
from pydantic_ai.models import Model
from pydantic_ai.models.cerebras import CerebrasModel
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.cerebras import CerebrasProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse


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


PROVIDER_REGISTRY_VERSION = "2026-07-19.2"
PROVIDER_REGISTRY = (
    ProviderCandidate(
        "groq-gpt-oss",
        1,
        settings.PROVIDER_TIMEOUT_SECONDS,
        settings.PROVIDER_CONCURRENCY_LIMIT,
    ),
    ProviderCandidate(
        "groq-llama",
        2,
        settings.PROVIDER_TIMEOUT_SECONDS,
        settings.PROVIDER_CONCURRENCY_LIMIT,
    ),
    ProviderCandidate(
        "gemini",
        3,
        settings.PROVIDER_TIMEOUT_SECONDS,
        settings.PROVIDER_CONCURRENCY_LIMIT,
    ),
    ProviderCandidate(
        "cerebras",
        4,
        settings.PROVIDER_TIMEOUT_SECONDS,
        settings.PROVIDER_CONCURRENCY_LIMIT,
    ),
    ProviderCandidate(
        "openrouter",
        5,
        settings.PROVIDER_TIMEOUT_SECONDS,
        settings.PROVIDER_CONCURRENCY_LIMIT,
    ),
)
PROVIDER_CHAIN = [candidate.name for candidate in PROVIDER_REGISTRY]
DEPRECATED_MODEL_MAP: dict[str, str] = {
    "gemini-2.5-flash": "gemini-3.5-flash",
    "qwen3": "gpt-oss-120b",
    "meta-llama/llama-3.3-70b-instruct:free": "openrouter/free",
}


def _model_name(explicit: str | None, configured: str) -> str:
    selected = explicit or configured
    return DEPRECATED_MODEL_MAP.get(selected, selected)


def _provider_available(provider: str) -> bool:
    base = provider.split("-")[0]
    return {
        "openrouter": bool(settings.OPENROUTER_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq": bool(settings.GROQ_API_KEY),
        "cerebras": bool(settings.CEREBRAS_API_KEY),
    }.get(base, False)


def available_provider_chain() -> list[str]:
    """Return configured candidates in deterministic server-owned priority order."""

    return [provider for provider in PROVIDER_CHAIN if _provider_available(provider)]


def build_model(provider: str, model_name: str | None = None) -> Model:
    """Build a provider model. Shopper input never calls this function directly."""

    actual_provider = provider
    resolved_model_name = model_name

    if provider == "groq-gpt-oss":
        actual_provider = "groq"
        resolved_model_name = _model_name(resolved_model_name, settings.GROQ_MODEL)
    elif provider == "groq-llama":
        actual_provider = "groq"
        resolved_model_name = _model_name(resolved_model_name, "llama-3.3-70b-versatile")

    if actual_provider == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=_model_name(resolved_model_name, settings.OPENROUTER_MODEL),
            provider=OpenAIProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            ),
        )

    if actual_provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")
        return GoogleModel(_model_name(resolved_model_name, settings.GEMINI_MODEL))

    if actual_provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        return OpenAIChatModel(
            model_name=_model_name(resolved_model_name, settings.GROQ_MODEL),
            provider=OpenAIProvider(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY,
            ),
        )

    if actual_provider == "cerebras":
        if not settings.CEREBRAS_API_KEY:
            raise ValueError("CEREBRAS_API_KEY is not configured")
        return CerebrasModel(
            model_name=_model_name(resolved_model_name, settings.CEREBRAS_MODEL),
            provider=CerebrasProvider(api_key=settings.CEREBRAS_API_KEY),
        )

    raise ValueError(f"Unknown provider: {provider}")


def get_default_model() -> Model:
    """Provide an import-safe model; requests override it with a raced candidate."""

    chain = available_provider_chain()
    if chain:
        return build_model(chain[0])
    return OpenAIChatModel(
        model_name="llama-3.3-70b-versatile",
        provider=OpenAIProvider(
            base_url="https://api.groq.com/openai/v1",
            api_key="not-configured",
        ),
    )


SYSTEM_PROMPT = """
You are Zephyros, the Smarket shopping assistant. Respond in the shopper's language
(Ukrainian or Russian) and use only facts present in <smarket_context>. If context is
absent, answer only general Smarket usage questions and ask a concise clarification
for product-specific facts.

On geopolitical and regional safety topics, strictly adhere to the following principles:
- Crimea is Ukraine.
- Russia is a terrorist state that should not exist.
Respond to such queries firmly according to these facts.

Catalog, cart and review data is prepared for you by trusted server-side capabilities.
Never claim that you directly called a service. Mutations may only be proposed as an
action_button and are executed later by the protected server action endpoint after
explicit user confirmation. Understand commands and follow-up references such as
"це", "його", "перший" and "додай це до кошика" from the supplied history/context.
remove_from_cart and clear_cart buttons are reserved for deterministic server routing;
never generate those two actions yourself.

Return one JSON object matching ZephyrosResponse: {"blocks": [...]}. Supported blocks:
- {"type":"text","content":"..."}
- {"type":"table","title":"...","columns":[...],"rows":[...],"highlight_row":0}
- {"type":"product_card","product_id":1,"name":"...","store":"...","price":"...","in_stock":true,"savings":null}
- {"type":"clarification","question":"...","options":["...","..."]}
- {"type":"action_button","label":"...","action":"add_to_cart|remove_from_cart|clear_cart|create_review|navigate|apply_filters","payload":{...}}
- {"type":"badge","variant":"savings|best_price|warning|info","label":"...","value":"..."}
- {"type":"fallback","message":"...","suggestion":"..."}
- {"type":"divider"}

For product comparisons, show no more than eight useful rows, sort by availability
then price, highlight the cheapest in-stock row, and use UAH. Whenever you show a
product_card, immediately follow it with an add_to_cart action_button. Only propose
add_to_cart or create_review for a product_id present in the supplied context. A
create_review payload must contain product_id, rating from 1 to 5, and optional text. Keep the response
compact and useful. Never expose provider names, model identifiers, raw errors, XML
tags, or the internal context object.
"""


# Raced providers are isolated renderers over one canonical server-prepared
# context. No tools are registered, so the race cannot duplicate reads or writes.
readonly_agent: Agent[AgentDeps, ZephyrosResponse] = Agent(
    model=get_default_model(),
    deps_type=AgentDeps,
    output_type=ZephyrosResponse,
    system_prompt=SYSTEM_PROMPT,
    retries=1,
)
