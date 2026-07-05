## 1. Frontend Configuration Update

- [x] 1.1 In `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx`, update `PROVIDER_MODELS.cerebras` to list `llama-3.3-70b` instead of `gpt-oss-120b`.

## 2. Backend Configuration Update

- [x] 2.1 In `services/zephyros_agent/.env`, set `CEREBRAS_MODEL` to `llama-3.3-70b`.
- [x] 2.2 In `services/zephyros_agent/.env.example`, set `CEREBRAS_MODEL` to `llama-3.3-70b`.
