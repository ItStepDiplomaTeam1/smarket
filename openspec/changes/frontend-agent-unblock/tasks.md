## 1. Frontend Client Fix

- [x] 1.1 In `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx`, ensure `provider` value `'auto'` maps to `null` on selection
- [x] 1.2 In `apps/react/frontend/my-react-app/src/hooks/api/useAiChatApi.ts`, ensure `provider` and `model_name` are passed correctly as `null` or omitted when null in the POST request body

## 2. Troubleshooting and Diagnostics

- [x] 2.1 Test OpenRouter explicitly and check container logs on the Hetzner host to diagnose the exact 503 error
