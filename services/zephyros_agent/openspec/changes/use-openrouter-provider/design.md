## Context

The `zephyros_agent` service uses Pydantic-AI to orchestrate LLM agents. Currently, it supports Gemini, Groq, and Cerebras. A fallback provider chain is configured in `app/agent/zephyros.py` so that the agent switches to the next available provider on rate limits (HTTP 429) or auth errors (HTTP 401).

The user selected OpenRouter as the primary AI provider, specifically targeting the `openai/gpt-oss-120b:free` model.

## Goals / Non-Goals

**Goals:**
- Add OpenRouter integration to `zephyros_agent`.
- Make OpenRouter the first choice in the fallback provider chain.
- Use `openai/gpt-oss-120b:free` as the default model.
- Configure `OPENROUTER_MODEL` in setting definitions.

**Non-Goals:**
- Removing existing providers (Gemini, Groq, Cerebras) from the system.
- Altering the user-facing API response schemas or frontend UI blocks.

## Decisions

- **Use OpenAIChatModel and OpenAIProvider**: OpenRouter has an OpenAI-compatible endpoint. We will instantiate `OpenAIChatModel` using `OpenAIProvider(base_url="https://openrouter.ai/api/v1", api_key=settings.OPENROUTER_API_KEY)`.
- **Add Configuration Keys**: Add `OPENROUTER_MODEL` to `Settings` in `app/config.py` with the default value of `"openai/gpt-oss-120b:free"`.

## Risks / Trade-offs

- **Rate Limits & Downtime on Free Tier**: The `openai/gpt-oss-120b:free` model is on the free tier, which can be highly rate-limited or experience downtime.
  - *Mitigation*: The circuit-breaker failover chain `PROVIDER_CHAIN` in `app/main.py` is already set up to cycle to `"gemini"`, `"groq"`, and `"cerebras"`. So if OpenRouter fails, it will transparently failover to the next working provider.
