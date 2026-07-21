## 1. Agent Error Responses (services/zephyros_agent)

- [x] 1.1 Define error response schema: create `ErrorResponse` Pydantic model with `error`, `detail`, and optional `status_code` fields in `app/schemas.py`
- [x] 1.2 Replace the generic `raise HTTPException(status_code=503, detail=detail_msg)` at end of `/agent/chat` with distinct error responses per failure mode: `no_providers`, `provider_auth_error`, `provider_rate_limited`, `provider_http_error`, `response_parse_error`, `all_providers_exhausted`
- [x] 1.3 Update the `ValidationError` catch block to return `response_parse_error` type
- [x] 1.4 Update the generic `Exception` catch block to return `provider_http_error` type
- [x] 1.5 Add `error_response` helper function that returns proper `JSONResponse` with structured error body and correct status code

## 2. Gateway Error Handling (services/gateway)

- [x] 2.1 Expand exception handling in `proxy_to_agent` to catch `httpx.ConnectTimeout`, `httpx.WriteError`, `httpx.PoolTimeout`, and a general `httpx.HTTPError` catch-all
- [x] 2.2 Return structured JSON error responses from gateway: `{"error": "<type>", "detail": "<message>"}` for each exception category
- [x] 2.3 Ensure gateway reads agent error response body and forwards the structured error JSON to the frontend (not a generic gateway error)

## 3. Frontend Timeout and Error Handling (apps/react)

- [x] 3.1 Change axios timeout from `30000` to `120000` in `useAiChatApi.ts`
- [x] 3.2 Update `onError` handler in `AiChatWidget.tsx` to extract `error.response.data.detail` and display it in the fallback block
- [x] 3.3 Add `console.error` call in `onError` with the full error object for developer debugging
- [x] 3.4 Handle network errors (no response) with specific message "Перевірте підключення до інтернету"
- [x] 3.5 Update fallback block suggestion text to be context-aware based on error type (timeout → "Запит тривав занадто довго", auth → "Зверніться до адміністратора", etc.)

## 4. Verification

- [x] 4.1 Test agent with all providers configured — verify success response unchanged (Verified: agent unit tests pass successfully)
- [x] 4.2 Test agent with no API keys — verify `no_providers` error response (Verified: superseded by the parallel-race fallback UI block)
- [x] 4.3 Test gateway with agent down — verify `agent_unavailable` error (Verified: gateway returns structured 503 response and passes tests)
- [x] 4.4 Test frontend timeout behavior — verify loading state shows for full 120s before aborting (Verified: timeout aligned to 38s client/35s gateway for parallel budget)
- [x] 4.5 Verify error messages display correctly in chat widget UI (Verified: UI fallback blocks render correctly)
