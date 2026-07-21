## Context

The Zephyros AI agent service (`services/zephyros_agent`) is called through the gateway proxy (`services/gateway`) from the React frontend (`apps/react`). The current error handling has three layers of problems:

1. **Frontend**: 30s axios timeout vs 120s gateway timeout — frontend gives up first
2. **Gateway**: Only catches `httpx.ReadTimeout` and `httpx.ConnectError`, missing 6+ other httpx exception types
3. **Agent**: All failures collapsed into a single generic 503 response with identical message

The AI agent makes sequential tool calls (search → compare → respond) that commonly take 30-90s. Complex multi-step queries regularly exceed the 30s frontend timeout.

## Goals / Non-Goals

**Goals:**
- Guaranteed delivery: frontend waits long enough for the agent to complete
- Structured errors: each layer returns typed, actionable error information
- User-visible clarity: chat widget shows context-specific error messages
- Developer visibility: console logs contain structured error objects for debugging

**Non-Goals:**
- Streaming responses (SSE) — out of scope, would be a larger architectural change
- Retry logic on the frontend — TanStack Query already supports this if needed later
- Changing the agent's provider chain or tool implementation
- Modifying the `ZephyrosResponse` schema (success responses unchanged)

## Decisions

### D1: Frontend timeout — 120s (matching gateway)

**Choice**: Set axios timeout to 120000ms.

**Rationale**: The gateway agent proxy already uses 120s. The frontend should match, not be shorter. 120s covers the worst case (provider latency + 3-4 tool calls + response generation). Shorter timeouts cause NS_BINDING_ABORTED.

**Alternatives considered**:
- 60s — too tight for complex multi-tool queries
- No timeout — risky for hung connections; 120s is a reasonable safety net
- Streaming (SSE) — would solve this properly but is a larger change

### D2: Structured error JSON from gateway

**Choice**: Gateway returns `{"error": "<type>", "detail": "<safe message>", "status_code": <int>}` for all httpx failures.

**Rationale**: The frontend needs to distinguish error types to show appropriate messages. Raw HTML 500 pages or generic text are useless.

**Error types**:
- `agent_timeout` (504) — upstream didn't respond
- `agent_unavailable` (503) — can't connect to agent
- `agent_error` (502) — agent returned unexpected response
- `gateway_error` (500) — internal gateway failure

### D3: Agent returns distinct error responses per failure mode

**Choice**: Different HTTP status codes and error types for different agent failures.

**Error mapping**:
| Failure | Status | Error Type | User Message |
|---|---|---|---|
| No providers configured | 503 | `no_providers` | ШІ-провайдери не налаштовані |
| Provider auth error (401) | 502 | `provider_auth_error` | Помилка автентифікації провайдера |
| Provider rate-limited (429) | 502 | `provider_rate_limited` | Забагато запитів, спробуйте за хвилину |
| Provider HTTP error | 502 | `provider_http_error` | Провайдер тимчасово недоступний |
| Response validation failed | 502 | `response_parse_error` | Агент повернув некоректну відповідь |
| All providers exhausted | 503 | `all_providers_exhausted` | Усі провайдери тимчасово недоступні |
| Tool call failed | 502 | `tool_error` | Помилка під час виконання операції |

**Rationale**: The `detail` field is safe to display to users (no secrets, no stack traces). The `error` type is for developers. The `last_error` from the provider is logged server-side only.

### D4: Frontend error extraction

**Choice**: Parse the error response body in `onError` handler, display the `detail` field as a fallback block, and `console.error` the full error object.

**Rationale**: TanStack Query's `onError` receives the Axios error which contains `error.response.data`. We extract `detail` for the user and log the full object for developers.

**Alternatives considered**:
- Axios interceptor that transforms all errors — too broad, would affect all API calls
- Custom error class — overkill for this scope

### D5: Gateway catches all httpx exceptions

**Choice**: Replace the two specific catches with a broader `httpx.HTTPError` catch-all, plus specific handling for `ReadTimeout` and `ConnectError` first.

**Rationale**: httpx has ~8 exception types that can occur. Catching specific ones first, then a general catch-all, ensures no unhandled exceptions leak as 500s.

**Exception hierarchy** (httpx):
```
HTTPError
├── RequestError
│   ├── ConnectError → 503
│   ├── ConnectTimeout → 504
│   ├── ReadTimeout → 504
│   ├── WriteError → 502
│   └── PoolTimeout → 504
├── RemoteProtocolError → 502
└── HTTPStatusError → (not thrown by client.send)
```

## Risks / Trade-offs

- **[Risk]** Longer frontend timeout (120s) means users see loading spinner for up to 2 minutes on slow queries → **Mitigation**: Status messages already cycle ("Думаю...", "Шукаю...", "Генерую..."). Could add a cancel button in future.
- **[Risk]** Agent's in-memory cooldown dict (`_provider_down_until`) doesn't work with multiple workers → **Mitigation**: Already documented with TODO in code. Out of scope for this change.
- **[Risk]** Structured error responses might reveal implementation details → **Mitigation**: Error types are generic strings (`provider_auth_error`), not stack traces. Detail messages are user-safe Ukrainian text.
- **[Trade-off]** Catching all httpx errors as 502/503/504 instead of letting some bubble as 500 → Acceptable, we want structured responses everywhere.
