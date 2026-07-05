## 1. Configuration Updates

- [x] 1.1 Add `OPENROUTER_MODEL` configuration setting to `app/config.py`
- [x] 1.2 Add `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` variables to `.env.example`
- [x] 1.3 Add `OPENROUTER_API_KEY` (commented out) and `OPENROUTER_MODEL` to `.env`

## 2. Core Agent Implementation

- [x] 2.1 Update `PROVIDER_CHAIN` to prioritize `"openrouter"` in `app/agent/zephyros.py`
- [x] 2.2 Update `_provider_available` in `app/agent/zephyros.py` to check for `OPENROUTER_API_KEY`
- [x] 2.3 Implement the `"openrouter"` case in `build_model` in `app/agent/zephyros.py` using `OpenAIChatModel` and `OpenAIProvider` pointing to `https://openrouter.ai/api/v1`

## 3. Verification & Tests

- [x] 3.1 Start the application locally and check `/health` endpoint
- [x] 3.2 Verify OpenRouter integration by sending a request to `/agent/chat` (if API key is configured) or verifying that fallback to Gemini/Groq works correctly when OpenRouter is unconfigured
