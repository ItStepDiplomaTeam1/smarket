# token-efficient-agent-routing Specification

## Purpose
TBD - created by archiving change harden-zephyros-parallel-provider-ux. Update Purpose after archive.
## Requirements
### Requirement: Safe versioned response cache
The service SHALL cache only read-only, schema-valid assistant responses using a key that includes normalized intent, locale, applicable catalogue/filter context version, and an anonymized user scope when the result is personalized. Cache entries SHALL have a bounded TTL and SHALL NOT contain credentials, raw provider payloads, or unconfirmed mutation actions.

#### Scenario: Equivalent read-only product comparison is cached
- **WHEN** a shopper repeats an equivalent read-only product-comparison request before its cache entry expires and the applicable context version is unchanged
- **THEN** the service SHALL return the cached typed response
- **AND** SHALL not start a provider attempt

### Requirement: Cache invalidation protects fresh and private data
The service SHALL invalidate or version-bypass cached responses affected by product updates, active filter changes, cart mutations, authentication changes, or expired action context. Cart-specific and authenticated personalized responses SHALL never be shared across users.

#### Scenario: Cart changes after a cached comparison
- **WHEN** a shopper changes their cart after a cart-aware response was cached
- **THEN** a later cart-aware request SHALL not use the prior cached response
- **AND** the service SHALL rebuild current context before responding

### Requirement: Single-flight orchestration for identical cache misses
For an identical, cacheable request context that is already being processed, the service SHALL join the existing in-flight orchestration rather than start a second provider race. The result SHALL be delivered only to requesters with the same authorized scope.

#### Scenario: Two identical requests arrive together
- **WHEN** two authorized requests with the same cache key arrive while the first is a cache miss
- **THEN** the service SHALL start one parallel provider race
- **AND** the second request SHALL await and receive the same validated result without starting additional provider attempts

### Requirement: Compact bounded provider context
Before parallel dispatch, the service SHALL construct one canonical context that excludes irrelevant history and raw payloads, deduplicates offers, retains only relevant structured action context, and enforces configured prompt and per-attempt output-token budgets.

#### Scenario: Long conversation contains irrelevant turns
- **WHEN** a shopper sends a new product search after a long conversation containing unrelated requests
- **THEN** the provider prompt SHALL include only the configured relevant history and compact current shopping context
- **AND** every raced candidate SHALL receive the same bounded context

### Requirement: Efficiency does not remove reliability routing
A cache miss that requires model reasoning SHALL use the configured parallel provider orchestration policy. Token-saving controls SHALL NOT silently downgrade that request to a single provider.

#### Scenario: Cache miss needs model reasoning
- **WHEN** no valid cache entry exists for an ambiguous shopping request
- **THEN** the service SHALL start all eligible provider candidates according to the parallel-routing requirement
- **AND** SHALL apply compact context and output budgets to each attempt

### Requirement: Consumption telemetry
The service SHALL record per-request cache outcome, single-flight outcome, estimated prompt/output tokens, attempt cancellation outcome, and provider-reported usage when available. It SHALL distinguish unavailable usage metadata from zero consumption.

#### Scenario: Provider does not return usage metadata
- **WHEN** a winning provider response contains no token usage information
- **THEN** telemetry SHALL record the locally estimated prompt and output tokens
- **AND** SHALL mark provider-reported usage as unavailable rather than zero

