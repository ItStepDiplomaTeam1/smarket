## Why

Under load or intensive tool use, the current default provider (Groq) frequently encounters strict rate limits (429 errors), leading to degraded user experience and frequent fallbacks. By switching to Gemini 3.5 Flash as the primary provider (which has been recently configured with a new API key) and adjusting fallback settings, Smarket's Zephyros Agent will benefit from higher rate limits, more stable structured JSON output compliance, and overall increased robustness.

## What Changes

- Change the default AI provider priority order (PROVIDER_CHAIN) in `zephyros_agent` to place Gemini first.
- Update `GEMINI_MODEL` to `gemini-3.5-flash` across settings, configurations, and environment templates.
- Update the backup/fallback model settings to use stable, high-performance models (e.g., `llama-3.3-70b-versatile` for Groq, and a stable model for OpenRouter).

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `provider-robustness`: The default prioritized provider chain will prioritize Gemini over Groq, and default model settings for active providers will be updated.

## Impact

- **zephyros_agent** backend service: Config changes in `app/agent/zephyros.py`, `app/config.py`, and `.env` / `.env.example`.
- Improved response stability and lower incidence of rate-limiting fallbacks.
