## Why

Set OpenRouter as the primary AI provider and use `openai/gpt-oss-120b:free` as the main model. This allows the system to utilize OpenRouter's aggregation and free tier models, reducing operational costs while preserving existing providers (Gemini, Groq, Cerebras) as fallback options.

## What Changes

- Add OpenRouter as the first candidate in the AI provider chain.
- Define `OPENROUTER_MODEL` configuration in application settings with a default of `openai/gpt-oss-120b:free`.
- Integrate OpenRouter builder logic into the model builder using `OpenAIChatModel` and `OpenAIProvider`.
- Update environment files (`.env` and `.env.example`) to document and enable OpenRouter configurations.

## Capabilities

### New Capabilities
- `agent-routing`: Defines primary AI provider and failover routing logic.

### Modified Capabilities

## Impact

- **Configuration (`app/config.py`)**: `OPENROUTER_MODEL` setting added.
- **Agent Initialization (`app/agent/zephyros.py`)**: `PROVIDER_CHAIN` updated to include `"openrouter"`, builder functions modified.
- **Environment (`.env`, `.env.example`)**: Added/updated keys for OpenRouter configuration.
