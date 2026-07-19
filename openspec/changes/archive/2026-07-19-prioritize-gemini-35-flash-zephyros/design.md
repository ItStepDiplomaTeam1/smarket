## Context

Smarket's Zephyros Agent uses `pydantic-ai` with a custom Circuit Breaker middleware. When the primary provider fails, it dynamically switches to subsequent models in `PROVIDER_CHAIN`. Currently, Groq (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) is the first provider in the chain, but due to severe free-tier API rate limits, users frequently experience rate limit (429) exceptions, causing latency issues and frequent fallbacks. The Gemini API key has been recently updated, allowing us to leverage Google's higher rate limits and robust JSON-schema compliance.

## Goals / Non-Goals

**Goals:**
- Shift the default model provider priority list to start with Gemini first.
- Update `GEMINI_MODEL` configuration value to use the high-performance `gemini-3.5-flash` model.
- Keep Groq, OpenRouter, and Cerebras as fallbacks.
- Correct default config values in `config.py` and `.env.example` to ensure robust operation.

**Non-Goals:**
- Adding direct support for new providers (like native OpenAI or Anthropic SDKs) in this specific change.
- Altering the circuit breaker retry timeout logic itself.

## Decisions

### Decision 1: Re-ordering PROVIDER_CHAIN to prioritize Gemini
- **Option A (Chosen):** Move `gemini` to the front of `PROVIDER_CHAIN` (i.e. `["gemini", "groq", "openrouter", "cerebras"]`).
  * *Rationale:* Gemini offers superior rate limits and native structured JSON schema enforcement, meaning the agent will rarely trigger 429 rate limit errors on the first attempt, improving availability.
- **Option B:** Keep Groq first.
  * *Rationale:* Groq is faster in token-per-second execution, but its rate limit makes it too fragile under any concurrent load.

### Decision 2: Update default model identifiers
- **Gemini:** Set default to `gemini-3.5-flash`.
- **Groq:** Set default to `llama-3.3-70b-versatile`.
- **OpenRouter:** Change default model to a stable/standard model or keep the current one.
- **Cerebras:** Ensure it uses a valid model name (such as `gpt-oss-120b`).

## Risks / Trade-offs

- **Risk:** Gemini might have slightly higher latency than Groq on initial tokens.
  * *Mitigation:* The latency penalty is minor (less than 1s) and is completely outweighed by the avoidance of 429 errors and the robust structured JSON output compliance.
