# Zephyros operations

Zephyros cannot make third-party APIs literally infallible. Its reliability path
uses deterministic read-only shopping context first, then a bounded first-valid
race across every eligible configured provider, followed by a typed useful
fallback. Configure at least two independent providers for the availability SLO.

## Runtime controls

- `ZEPHYROS_ROUTING_MODE=parallel-race` enables automatic concurrent routing;
  `sequential` is the immediate rollback mode.
- `ZEPHYROS_PARALLEL_COHORT_PERCENT` accepts `0..100` and deterministically assigns
  shoppers to parallel mode. Use `5`, `25`, `50`, then `100` during rollout.
- `ZEPHYROS_ACTION_EXECUTOR_ENABLED=false` disables cart/review mutations while
  leaving read-only chat operational.
- `ZEPHYROS_OPERATOR_KEY` protects diagnostics and cache invalidation. Store it as
  a secret; never expose it to the shopper app.

All model IDs, deadlines, concurrency limits, prompt budgets, cache TTLs, and SLOs
are validated on startup. Use the stable defaults in `.env.example`; OpenRouter's
free router remains the last-priority emergency candidate.

## Protected operations

`GET /internal/diagnostics` returns registry-safe circuit state, routing mode, SLO
targets, counters, and latency aggregates. Send `X-Zephyros-Operator-Key`; model
IDs, API keys, and raw provider errors are never returned.

`POST /internal/cache/invalidate` accepts `{"scope":"catalog"}` or
`{"scope":"user","user_id":"<uuid>"}` with the same operator header. Product
updates should bump the catalog namespace; confirmed cart/review actions already
invalidate the affected user namespace.

## Rollout and rollback

1. Deploy with `ZEPHYROS_ROUTING_MODE=sequential`, action execution enabled only
   after its endpoint health check passes, and verify deterministic cart/catalog
   responses.
2. Switch to `parallel-race` at a 5% cohort. Compare success rate, p95 latency,
   validation failures, rate limits, and provider-reported usage against the
   sequential baseline.
3. Raise the cohort only while `CHAT_SUCCESS_RATE_SLO` and
   `CHAT_LATENCY_P95_SLO_MS` remain satisfied. Confirm cache-hit and coalesced
   request ratios reduce provider attempts without changing results.
4. At any SLO regression, set `ZEPHYROS_ROUTING_MODE=sequential` and cohort `0`.
   If writes are affected, also set `ZEPHYROS_ACTION_EXECUTOR_ENABLED=false`.

Track at minimum: `chat_requests_total`, `chat_responses_total`,
`chat_request_latency`, `chat_cache_total`, `chat_singleflight_total`,
`provider_attempt_outcomes_total`, `provider_attempt_latency`,
`provider_winners_total`, `provider_attempt_cancellations_total`,
`prompt_tokens_estimated_total`, `output_tokens_requested_total`,
`output_tokens_estimated_total`, `provider_reported_input_tokens_total`,
`provider_reported_output_tokens_total`, and `provider_usage_unavailable_total`.
