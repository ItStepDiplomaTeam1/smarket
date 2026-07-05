## Why

When the frontend client hardcodes or saves the selected provider (such as `"openrouter"`) in its store, it sends it explicitly in the request payload. This forces the backend to bypass its automatic failover chain, causing immediate 503 errors for users if that provider has rate limits or configuration issues.

## What Changes

- Modify the frontend `useSendAiMessage` hook to omit or send `null` for `provider` and `model_name` if "Auto-choice" (null) is active, ensuring the backend uses its prioritized failover chain.
- Investigate OpenRouter's 503 error on the production host by sending an explicit provider request and checking container logs.

## Capabilities

### New Capabilities
- `frontend-routing`: Resolves explicit provider settings and auto-switching configurations.

### Modified Capabilities

## Impact

- **Frontend Client**: `useAiChatApi.ts` and `AiChatWidget.tsx` modified.
