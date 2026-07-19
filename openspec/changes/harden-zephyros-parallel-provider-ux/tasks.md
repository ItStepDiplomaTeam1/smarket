## 1. Provider registry and shared health foundation

- [x] 1.1 Define the server-owned provider registry, configuration validation, candidate priority, per-provider timeout, and concurrency allowance in `services/zephyros_agent`.
- [x] 1.2 Replace process-local cooldown tracking with Redis-backed circuit state, failure classification, half-open probes, and bounded emergency behavior when Redis is unavailable.
- [ ] 1.3 Add correlated structured logs, metrics, and audit events for chat requests, provider attempts, circuit transitions, response validation, fallbacks, and actions.
- [ ] 1.4 Add protected operator diagnostics exposing registry-safe provider state and configured SLO/latency metrics without credentials or shopper-facing model details.
- [x] 1.5 Define cache scope/version namespaces, TTL policy, cacheability rules, and token/usage metric schema for read-only assistant responses.

## 2. Safe parallel provider orchestration

- [x] 2.1 Refactor the chat request contract so automatic server routing ignores legacy provider/model fields and records compatibility telemetry.
- [x] 2.2 Implement the concurrent candidate dispatcher with request budgets, provider deadlines, first-valid-wins selection, cancellation/discard of losing attempts, and deterministic priority tie-breaking.
- [x] 2.3 Implement response schema, size, action-payload, and prepared-context validation before a candidate can win the race.
- [ ] 2.4 Split existing agent execution into a deterministic read-only context stage and provider-isolated rendering stage so raced providers do not duplicate downstream retrieval work.
- [ ] 2.5 Replace direct mutating agent tools with expiring, user-bound action tokens and a centralized idempotent executor for cart and review actions.
- [x] 2.6 Return a typed, useful fallback response with available shopping context and retry action when no candidate validates.
- [ ] 2.7 Implement semantic response caching and Redis single-flight coordination with user/context/version-safe cache keys and invalidation hooks for product and cart changes.
- [ ] 2.8 Implement prompt/context compaction, history relevance limits, duplicate-offer elimination, per-attempt output budgets, and requested-versus-observed token accounting before provider fan-out.

## 3. Gateway and shopper contract migration

- [x] 3.1 Update the Gateway agent proxy to preserve correlation IDs and tolerate the automatic-routing request contract during the legacy compatibility window.
- [x] 3.2 Remove persisted provider/model selection and outbound provider/model fields from the shopper AI chat store and request hook.
- [x] 3.3 Replace the provider/model settings controls with shopper-relevant assistant help and preferences; retain clear-history behavior.
- [x] 3.4 Add ready-state suggested prompts, plain-language working steps, degraded-state explanation, accessible retry, and no-loss input recovery.
- [x] 3.5 Render token-backed mutation proposals with an explicit confirmation dialog; keep read-only navigation and filters one-click.
- [x] 3.6 Preserve and verify dark mode, desktop floating mode, mobile full-screen layout, keyboard shortcut, live status, focus management, and 44px touch targets.

## 4. Verification, rollout, and operations

- [ ] 4.1 Add unit tests for registry eligibility, Redis circuit transitions, provider failure classification, concurrency limits, winner selection, cancellation/discard behavior, and typed fallback responses.
- [ ] 4.2 Add agent tests with fake providers covering timeout, auth error, rate limit, malformed result, internal dependency failure, all-provider exhaustion, and exactly-once mutation confirmation.
- [ ] 4.3 Add Gateway and shopper tests for legacy-contract compatibility, removed selector behavior, retry, action confirmation, responsive accessibility, and no raw provider error exposure.
- [x] 4.4 Run the Zephyros, Gateway, and shopper-app test/lint suites; record baseline versus parallel-mode success rate, latency, validation failures, and quota usage.
- [ ] 4.5 Deploy behind routing-mode and action-executor feature flags; perform shadow traffic, staged cohort rollout, SLO review, and rollback validation before enabling automatic parallel routing for all shoppers.
- [ ] 4.6 Add cache, single-flight, invalidation, prompt-budget, and token-accounting tests; verify a cache miss preserves parallel routing while a safe cache hit makes no provider request.
- [ ] 4.7 Establish a production token and request-cost baseline, then monitor cache-hit ratio, coalesced-request ratio, prompt/output tokens, cancellation outcomes, and provider-reported usage during staged rollout.
