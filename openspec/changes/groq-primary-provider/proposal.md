## Why

To make the AI chat assistant Zephyros more robust, high-performing, and cost-effective, Groq needs to be configured as the primary AI provider with `openai/gpt-oss-20b` as the default model. We also want to configure a prioritized provider chain fallback to automatically recover from rate limits or downtime.

## What Changes

- Update default provider and model configuration in the frontend store `useAiChatStore.ts` to `groq` and `openai/gpt-oss-20b`.
- Update provider model list in `AiChatWidget.tsx` settings panel.
- Update default settings in `services/zephyros_agent/app/config.py` (`GROQ_MODEL = "openai/gpt-oss-20b"`, `CEREBRAS_MODEL = "qwen3"`).
- Reconfigure `PROVIDER_CHAIN` in `zephyros.py` to: `["groq-gpt-oss", "groq-llama", "gemini", "cerebras", "openrouter"]`.
- Update `_provider_available`, `build_model`, and `_is_down` to correctly handle virtual provider names (e.g. `groq-gpt-oss` and `groq-llama`) which resolves model-specific rate limiting and failover.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `provider-robustness`: Reconfigure default priorities and default models.

## Impact

- **apps/react** frontend code: Default store properties, model settings panel options.
- **zephyros_agent** service: Default environment variables, fallback provider list, and virtual model-level routing.
