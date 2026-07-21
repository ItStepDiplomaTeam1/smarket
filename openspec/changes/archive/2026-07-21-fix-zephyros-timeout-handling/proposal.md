## Why

The Zephyros AI agent frequently fails with `NS_BINDING_ABORTED` in the browser and returns opaque errors to users. Root causes: (1) the frontend has a 30s timeout while the AI agent routinely takes 30-90s for complex queries with tool calls, (2) the gateway only catches 2 of ~8 httpx exception types, and (3) all agent failures produce the same generic 503 response regardless of cause. Users see "Не вдалося отримати відповідь" with no way to diagnose whether it's a timeout, auth error, rate limit, or service outage.

## What Changes

- **Frontend timeout** increased from 30s to 120s to match gateway's agent proxy timeout
- **Gateway agent proxy** catches all httpx exceptions (not just `ReadTimeout` and `ConnectError`) and returns structured error JSON
- **Agent endpoint** returns distinct error responses per failure mode (provider auth, rate limit, service error, validation error, tool failure) with safe-to-display detail messages
- **Frontend error handler** extracts error details from structured responses and displays context-specific messages in the chat widget
- **Frontend console** logs structured error objects for developer debugging (safe, non-sensitive info only)

## Capabilities

### New Capabilities
- `agent-error-resilience`: End-to-end error handling, timeout alignment, and structured error propagation from agent → gateway → frontend with user-visible error messages

### Modified Capabilities

## Impact

- `services/zephyros_agent/app/main.py` — agent endpoint error responses
- `services/gateway/app/api/routes/agent.py` — gateway proxy exception handling
- `apps/react/frontend/my-react-app/src/hooks/api/useAiChatApi.ts` — frontend timeout and error extraction
- `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx` — error display in chat UI
- No API contract changes (error responses are additive, existing success responses unchanged)
- No new dependencies
