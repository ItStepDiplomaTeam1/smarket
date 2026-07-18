## Why

Currently, if an AI provider (e.g., Gemini, Groq, Cerebras, OpenRouter) fails due to rate limits, API downtime, or key/auth issues, the Zephyros agent may return a 500/503 error to the client. Smarket needs a robust health-check and circuit-breaking mechanism that dynamically identifies failing AI providers, temporarily blocks them, and automatically falls back to the next available healthy provider in the chain.

## What Changes

- **Automatic Provider Health Checking**: Check the status of each provider upon request failures.
- **Dynamic Provider Blocking**: Maintain a temporary block (e.g., in-memory or Redis-based) for failing providers (e.g., block for 5 minutes after a consecutive failure or specific error codes).
- **Auto-fallback Mechanics**: Modify the provider selection chain to skip blocked providers and automatically route the request to the next healthy provider.
- **Failure Auditing & Logging**: Generate warning logs and/or audit events when a provider is blocked or unblocked.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `provider-robustness`: Add requirements for health checking and dynamic blocking/circuit-breaking of failing AI providers.

## Impact

- `services/zephyros_agent/app/agent/zephyros.py`: Update the provider chain builder to check health status and skip blocked providers.
- `services/zephyros_agent/app/main.py`: Implement routing/fallback logic and update failure handling to trigger a block on a provider when a call fails.
- `services/zephyros_agent/app/config.py`: Add settings for block duration and health-check behavior.
