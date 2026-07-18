## Context

The `zephyros_agent` service uses a prioritized chain of AI providers (Groq, Gemini, OpenRouter, Cerebras) to fulfill chat requests. Currently, the service has basic cooldown logic for `ModelHTTPError` (401 and 429 status codes) inside `/agent/chat` and `/agent/summarize-plan`. However:
1. It does not actively probe providers on startup or check API keys/network connectivity until a user request fails.
2. The `/agent/chat/stream` endpoint does not apply cooldown logic to failing providers.
3. General connection exceptions (e.g. `ConnectError`, `TimeoutError`) and server errors (500/503) do not trigger provider cooldowns, leading to repeated attempts on broken endpoints.
4. The admin/operators cannot monitor provider availability since the `/health` endpoint returns a static `ok` status.

## Goals / Non-Goals

**Goals:**
- **Active Probing**: Implement a health check probe for each provider to verify API keys and network connectivity.
- **Startup Verification**: Perform health checks on startup and put any failing providers on initial cooldown.
- **Stream/Fallback Parity**: Ensure `/agent/chat/stream` triggers provider cooldown blocks upon failures just like the standard chat endpoint.
- **Extended Circuit Breaking**: Mark providers as down on timeouts, connection errors, and 5xx API errors.
- **Health Endpoint Visibility**: Expose the health/blocked status of all configured providers via the `/health` endpoint.

**Non-Goals:**
- Continuous background polling/probing of AI APIs (which would waste API credits and trigger rate limits).

## Decisions

### 1. Active Probing Implementation
We will implement `async def probe_provider(provider: str) -> bool` using a simple `Agent` instance with the model for that provider. It will run a minimal query (e.g., prompt: `"1"`, `max_tokens=1` or simple validation) with a strict timeout of 3.0 seconds. 

### 2. Global Cooldown on Any Provider Failure
Any exception encountered during execution (except user/input validation issues) will trigger `_mark_down` for the failing provider. This includes:
- `httpx.ConnectError`, `httpx.TimeoutError`, `asyncio.TimeoutError`
- `ModelHTTPError` with status codes 401, 429, or 5xx
- Generic exceptions during API requests.

### 3. Exposing Provider States via `/health`
Update `/health` to return a list of providers with their configuration status (configured vs missing keys), and check if they are in cooldown (including remaining cooldown seconds).

## Risks / Trade-offs

- **Risk**: Probing on startup might delay container ready state.
  - **Mitigation**: Startup probes are run concurrently in a `lifespan` hook and capped at a 3-second timeout per provider. If a probe fails, the service still starts, but the provider is marked as down (cooldown) immediately.
- **Risk**: Dynamic fallback changes token usage/costs if the system routes to more expensive models when a cheap one fails.
  - **Mitigation**: Smarket uses a prioritized chain; fallback is necessary for high availability. Warn logs will clearly document provider transition events.
