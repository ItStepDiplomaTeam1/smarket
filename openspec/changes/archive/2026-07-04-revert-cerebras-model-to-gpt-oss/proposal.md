## Why

Cerebras Inference has deprecated the `llama-3.3-70b` model and currently only supports `gpt-oss-120b` as its primary production model. Changing the config to `llama-3.3-70b` resulted in `404 Not Found` errors from the Cerebras API on the production server. We need to revert the configuration to `gpt-oss-120b`.

## What Changes

- Revert model options mapping for `cerebras` in `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx` to use `gpt-oss-120b` instead of `llama-3.3-70b`.
- Revert default environment configuration values in `services/zephyros_agent/.env` and `services/zephyros_agent/.env.example` to point `CEREBRAS_MODEL` to `gpt-oss-120b`.

## Capabilities

### New Capabilities
- `cerebras-production-model`: Align model configuration with the active Cerebras production model (`gpt-oss-120b`).

### Modified Capabilities

## Impact

- Frontend: `AiChatWidget.tsx` options list.
- Backend: `zephyros_agent` environment configuration (`.env` and `.env.example`).
