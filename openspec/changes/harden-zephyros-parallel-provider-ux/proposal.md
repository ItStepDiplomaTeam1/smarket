## Why

Zephyros currently tries providers sequentially, stores provider cooldown state only in a process-local dictionary, and exposes provider/model selection to shoppers. A transient upstream failure can therefore delay or fail a useful response, while a technical choice that users cannot evaluate adds clutter and can pin a conversation to an unhealthy provider.

This change makes automatic routing the only shopper-facing mode and introduces a controlled parallel race for a validated answer. It cannot promise literal 100% availability from third-party APIs, but it makes success measurable, observable, and resilient when one or several providers fail.

## What Changes

- **BREAKING** Remove `provider` and `model_name` as supported shopper controls from the chat contract and remove provider/model selectors from the shopper UI. Legacy client values are ignored during the compatibility window rather than used to pin routing.
- Add a server-owned model registry and a Redis-backed provider health state shared by all Zephyros workers.
- Replace sequential fallback with a budgeted parallel provider race: invoke configured, eligible provider candidates concurrently; validate every result; return the first valid result; cancel/ignore losing work; and record outcomes for adaptive routing.
- Add token- and consumption-efficiency controls that preserve the reliability path: versioned semantic caching, single-flight request coalescing, compact relevant context, bounded output budgets, and cost/usage telemetry.
- Separate read-only AI planning/rendering from side effects. Cart and review mutations remain explicit UI-confirmed actions and run exactly once outside the provider race.
- Add deterministic graceful degradation for supported shopping intents when no model response validates: return available catalogue/cart data plus a retry option, never malformed model text.
- Add end-to-end observability, fault-injection tests, and service-level success/latency targets for provider routing.
- Redesign the customer-facing assistant as a focused shopping copilot: no model settings, clear availability/status feedback, suggested prompts, structured result cards, explicit action confirmation, retry/copy controls, and accessible mobile/desktop behavior.

## Capabilities

### New Capabilities

- `parallel-provider-orchestration`: Concurrent, validated, server-owned provider selection with shared health state, cancellation, budgets, and safe degradation.
- `agent-reliability-observability`: Correlated metrics, audit events, SLOs, and deterministic failure testing for the end-to-end assistant path.
- `token-efficient-agent-routing`: Cache, deduplicate, and compact AI work while preserving the parallel provider race for cache misses that require model reasoning.
- `agent-shopping-copilot-experience`: A shopper-first Zephyros interface that communicates progress and degraded states, renders actionable results, and hides provider mechanics.

### Modified Capabilities

- `provider-robustness`: Replace user-pinned, sequential fallback requirements with automatic parallel routing and shared circuit-breaker requirements.
- `agent-message-history`: Preserve structured action context while ensuring that a raced model run cannot directly repeat a mutation.

## Impact

- `services/zephyros_agent`: request schema, provider registry, orchestration lifecycle, Redis state, tool execution boundaries, response/error contract, telemetry, and tests.
- `apps/react/frontend/my-react-app`: AI chat store, request hook, widget settings/status/action rendering, accessibility, and component tests.
- `services/gateway`: agent proxy contract forwarding must tolerate removal of shopper provider/model fields and preserve request correlation.
- Redis becomes required for coordinated circuit breaking and provider outcome counters; no new database schema is required.
- Redis also stores safe cache entries, cache invalidation versions, and in-flight request coordination; provider token/usage metadata is recorded only when the provider SDK supplies it.
- The legacy client contract changes, so gateway and frontend rollout must be deployed compatibly and monitored together.
