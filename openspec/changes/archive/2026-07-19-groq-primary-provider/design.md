## Context

We want to prioritize Groq as the main AI provider with `openai/gpt-oss-20b` as the recommended default model. When Groq's primary model is rate-limited or fails, we want to try the fallback model `llama-3.3-70b-versatile` on Groq, before falling back to other providers.

## Goals / Non-Goals

**Goals:**
- Make Groq the default provider on the frontend.
- Make `openai/gpt-oss-20b` the default recommended model on the frontend.
- Implement the requested priority chain: `groq-gpt-oss -> groq-llama -> gemini -> cerebras -> openrouter`.
- Correctly route virtual provider names (e.g. `groq-gpt-oss`, `groq-llama`) to base provider `groq` with model names `openai/gpt-oss-20b` and `llama-3.3-70b-versatile`.

## Decisions

### Decision 1: Virtual providers for model-level fallback
- **Option A (Chosen):** Define virtual names `groq-gpt-oss` and `groq-llama` in `PROVIDER_CHAIN`. Strip suffix inside `_provider_available` and `build_model`.
  * *Rationale:* This is highly extensible and avoids having to rewrite the core loop in `main.py` which tracks cooldowns by provider name. It allows tracking rate limits for specific models independently.

## Risks / Trade-offs

- **Risk:** Cooldown in base provider might not affect virtual ones.
  * *Mitigation:* Modified `_is_down` to check if either the virtual provider OR its base provider (e.g., `'groq'`) is in cooldown.
