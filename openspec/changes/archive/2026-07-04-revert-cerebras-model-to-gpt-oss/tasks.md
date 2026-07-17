## 1. Revert Frontend Model Configuration

- [x] 1.1 In `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx`, update `PROVIDER_MODELS.cerebras` to list `gpt-oss-120b` instead of `llama-3.3-70b`.

## 2. Revert Backend Settings Defaults

- [x] 2.1 In `services/zephyros_agent/.env`, set `CEREBRAS_MODEL` to `gpt-oss-120b`.
- [x] 2.2 In `services/zephyros_agent/.env.example`, set `CEREBRAS_MODEL` to `gpt-oss-120b`.
