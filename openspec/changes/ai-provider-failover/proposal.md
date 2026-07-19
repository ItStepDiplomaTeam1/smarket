## Why

When the user has a specific AI provider pinned (for example, Google Gemini), and that provider becomes rate-limited (status 429) or goes down (status 503), the request immediately aborts and returns an error. This results in a poor user experience. Instead, the backend should try the user's preferred provider first, but seamlessly fall back to other configured, healthy providers (e.g., Groq, OpenRouter) if the preferred provider fails.

## What Changes

- Modify `services/zephyros_agent/app/main.py` in regular chat (`/agent/chat`) and streaming chat (`/agent/chat/stream` or equivalent generator logic) to set the preferred requested provider as the first candidate, while retaining other configured providers in the candidates list as fallbacks instead of having only one candidate.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `provider-robustness`: Enhance the provider fallback / circuit breaker logic to include failover for pinned requests.

## Impact

- **zephyros_agent** service: Changes in `app/main.py` candidates resolution.
- Better resilience against Google Gemini or Groq rate limits.
