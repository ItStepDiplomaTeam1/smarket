## Context

Zephyros is a FastAPI/pydantic-ai service called through the Gateway by the React shopper app. It currently accepts client-selected `provider` and `model_name`, tries candidates sequentially, and keeps cooldowns in `_provider_down_until`, an in-memory dictionary. That state is neither shared between workers nor visible to the shopper. The existing widget is polished and responsive, but its settings panel exposes four providers and their models even though an ordinary shopper has no meaningful basis to make that decision.

The existing `zephyros-full-resilience` change corrects stale model names, probe timeouts, and a search metadata fallback. This follow-up keeps those fixes and replaces the remaining sequential, user-pinned routing model. It spans the agent service, Gateway request contract, the shopper app, Redis, and automated tests.

## Goals / Non-Goals

**Goals:**

- Return the earliest schema-valid, safe assistant response from all eligible configured providers, without exposing provider choice to shoppers.
- Make provider health decisions consistent across processes and observable by request ID.
- Ensure parallel model attempts cannot duplicate writes to a cart or reviews service.
- Degrade to useful structured shopping data when models are unavailable.
- Make the interface explain progress, result confidence/degradation, and next actions without technical jargon.
- Define a measurable availability target rather than claiming unavailable external dependencies are infallible.

**Non-Goals:**

- Guarantee literal 100% availability from any external model provider, Internet connection, or internal dependency.
- Change authentication, product schemas, ETL/indexing, or provider billing plans.
- Persist a long-term chat transcript or expose raw provider/model diagnostics to shoppers.
- Stream token-by-token model output in this change.

## Decisions

### 1. A server-owned candidate registry replaces browser model selection

`ChatRequest` will no longer use shopper-selected `provider` or `model_name`. A versioned, environment-configured registry owns provider credentials, model IDs, priority, per-provider timeout, and concurrency allowance. The Gateway will tolerate old fields during rollout but the agent ignores them and emits a deprecation metric.

The priority remains a deterministic tie-breaker and dispatch order for non-race operations; it is not a user preference. This avoids stale browser configuration and prevents a shopper from pinning a provider already known to be unhealthy.

**Alternative considered:** retain an “advanced” provider selector. Rejected because it weakens reliability, leaks operational concepts into the shopper flow, and makes production defects harder to reproduce.

### 2. Use a parallel, first-valid-wins race instead of serial fallback

For an eligible request, the orchestrator snapshots enabled candidates that are configured, not in circuit-breaker cooldown, and below their concurrency allowance. It starts one isolated attempt for every candidate in that snapshot concurrently. Each attempt has a provider-specific hard deadline and returns either a typed success or a classified failure.

The first response that passes the `ZephyrosResponse` Pydantic validation and response-safety checks wins. The orchestrator cancels unfinished tasks where the SDK supports cancellation; otherwise it discards their late result. A short optional quality window is deliberately not used: predictable low latency is more valuable than attempting to rank multiple equivalent completions.

**Alternative considered:** sequential fallback with longer timeouts. Rejected because failure latency adds linearly. A staggered hedge is cheaper but does not meet the requested "any provider that answers first" behavior; it can be introduced later as a cost-control mode if production quota data warrants it.

### 3. Model reasoning is side-effect free; action execution is centralized and idempotent

Parallel candidates receive the same canonical, read-only shopping context and can only propose structured `action_button` blocks. They MUST NOT call mutation tools. The frontend asks for explicit confirmation, then invokes a single Gateway/action endpoint carrying an opaque one-time action ID. The service validates the user, expiry, payload, and idempotency key before performing exactly one cart/review mutation.

Read-only retrieval is executed once in a deterministic context-building stage where required, not independently by every provider. This eliminates duplicate downstream calls and removes the possibility of multiple agents changing the same cart.

**Alternative considered:** let each agent run all existing tools and cancel losers. Rejected because a cancelled completion may already have completed a write, which cannot be safely undone.

### 4. Redis stores shared health, rate, and outcome state

Provider circuit state, failure counters, half-open probes, per-provider in-flight leases, and rolling outcome summaries are stored in Redis with TTLs and atomic operations. Failure classes distinguish permanent configuration/auth errors, quota/rate errors, provider 5xx, timeouts, invalid output, and local dependency failure. Only provider-attributable failures open that provider’s circuit; local search/cart failures use their own fallback path and do not poison every model.

**Alternative considered:** retain process-local dictionaries. Rejected because multiple Granian workers disagree about provider health and restart clears useful protection.

### 5. Validation and deterministic degradation form the final safety net

Every winning candidate response is parsed as the existing UI-block schema, constrained for maximum block sizes/action payloads, and checked against the prepared context. If no candidate produces a valid response before the request budget expires, the service returns a valid structured fallback: a concise explanation, any available search/cart results, and a retry action. The HTTP response remains a typed Zephyros response for expected model failures; only invalid client input and unavailable required internal data use transport errors.

### 6. The assistant becomes a shopping copilot, not a model console

The visible name remains Zephyros for continuity, with “Промін — помічник для покупок” as descriptive copy. The settings overlay loses provider/model selects. It is replaced by lightweight help and preferences that are meaningful to shoppers, such as compact result display and clear-history.

The chat has four explicit states: ready with suggested shopping prompts; working with semantic steps; answered with cards/tables and clear actions; and degraded with a plain-language notice plus Retry. Provider names, raw errors, and internal model IDs never appear. Existing dark theme, desktop floating panel, mobile full-screen panel, keyboard shortcut, copy, and responsive blocks are preserved. All action buttons use confirmation for mutations; read-only navigation/filter actions stay one-click.

### 7. Save tokens before the race, never by silently weakening a required race

The effective request path is: validate and normalize → compute a context/version-aware cache key → join an identical in-flight request if present → build compact canonical context → run the parallel race only when model reasoning is required. A cache hit or joined in-flight request returns the same typed response without calling a provider; a cache miss still uses the configured parallel routing policy.

Only read-only responses are cacheable. The key includes normalized user intent, locale, relevant filter/cart/catalog version, and an anonymized user scope where personalization matters. Mutation proposals, authentication-sensitive data, and stale price/cart results are never served from a shared cache. Product updates and cart mutations bump or invalidate the relevant version namespace.

Before fan-out, the context builder strips raw payloads and irrelevant history, retains only recent turns and referenced structured actions, deduplicates product offers, and uses structured compact summaries. Every candidate receives the same bounded prompt and output-token limit. The race still begins concurrently for all eligible candidates; the first valid response closes the local attempts best-effort. Cancellation cannot guarantee that an upstream provider will not bill already-generated tokens, so cost reporting separates requested, observed, and provider-reported usage.

**Alternative considered:** reduce spending by launching just one provider for inexpensive requests. Rejected as the default because it quietly removes the requested availability guarantee. It remains an explicitly configured future operating mode, allowed only after SLO and quota evidence demonstrates it is safe for a defined low-risk intent class.

## Risks / Trade-offs

- **[Risk] Parallel fan-out consumes more quota and can itself trigger rate limits.** → Candidate eligibility checks, per-provider concurrency allowances, request budgets, cancellation, outcome metrics, and a configurable later hedge mode cap the blast radius.
- **[Risk] A fast response can be lower quality than a slower one.** → Enforce schema/context validation and use strongly curated system prompts; track correction/retry rates by winning provider before considering a quality window.
- **[Risk] Redis is temporarily unavailable.** → Fail closed for shared breaker writes but keep a bounded per-process emergency cooldown and expose degraded health; do not treat Redis loss as all-provider failure.
- **[Risk] Separating actions changes conversation semantics.** → Preserve structured history and carry an expiring action token so confirmation remains natural while writes become exactly-once.
- **[Risk] Removing the selector surprises power users.** → Remove it from the shopper UI, document automatic routing, and retain operator-only health/registry diagnostics outside the customer app.
- **[Risk] Third-party outages can still exhaust all candidates.** → Return a useful structured fallback and measure the event; the availability objective is an SLO, not an absolute guarantee.
- **[Risk] Cached product or cart content can become stale or cross user boundaries.** → Cache only read-only, scoped responses with short TTLs and version-key invalidation; never share authenticated/cart-specific results across users.
- **[Risk] Attempt cancellation does not guarantee upstream token billing stops.** → Use compact prompts and hard output budgets before dispatch, cancel best-effort after a winner, and measure provider-reported usage separately from local estimates.

## Migration Plan

1. Deploy registry, Redis health primitives, telemetry, and the race engine behind `ZEPHYROS_ROUTING_MODE=sequential` without changing the client contract.
2. Run synthetic fault tests and shadow parallel attempts that do not influence responses; compare success rate, latency, validation failure rate, and quota impact.
3. Enable `parallel-race` for a small production cohort, then all shoppers after the defined SLO gates pass.
4. Deploy the frontend that omits provider/model fields and removes the selector. Gateway and agent continue ignoring legacy fields for one release window.
5. Remove legacy request fields and old persisted browser settings after telemetry shows no material legacy traffic.

Rollback switches routing mode back to sequential server-side without a frontend rollback. If the new action executor is unhealthy, hide mutation actions and preserve read-only assistant responses.

## Open Questions

- Which providers and quota plans are actually production-enabled, and what maximum concurrent request limit is acceptable for each?
- What availability and latency SLO values are realistic after one week of baseline production telemetry?
- Should operator diagnostics live in the existing admin dashboard or a protected Zephyros-only endpoint?
