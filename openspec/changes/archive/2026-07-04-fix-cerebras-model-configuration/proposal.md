## Why

Requests targeting the Cerebras provider fail because the model name is incorrectly configured as `gpt-oss-120b` (which belongs to OpenRouter) in both the frontend model selection mapping and backend `.env` configuration, instead of a valid Llama model supported by Cerebras (like `llama-3.3-70b`).

## What Changes

- Update model picker choices in frontend (`apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx`) to map Cerebras to `llama-3.3-70b` instead of `gpt-oss-120b`.
- Correct default values and example files (`services/zephyros_agent/.env` and `services/zephyros_agent/.env.example`) to reference `llama-3.3-70b`.

## Capabilities

### New Capabilities
- `cerebras-model-alignment`: Align the Cerebras model identifier across both frontend select dropdowns and backend environment variables.

### Modified Capabilities

## Impact

- Frontend: `AiChatWidget.tsx` model options configuration.
- Backend: `zephyros_agent` local `.env` and `.env.example` settings.
