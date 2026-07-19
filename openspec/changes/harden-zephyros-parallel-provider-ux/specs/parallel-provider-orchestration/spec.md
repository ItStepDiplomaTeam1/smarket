## ADDED Requirements

### Requirement: Server-owned automatic provider selection
The Zephyros chat service SHALL select provider candidates exclusively from a server-owned, versioned registry. Shopper chat requests SHALL NOT be able to pin a provider or model.

#### Scenario: Legacy client sends provider fields
- **WHEN** a chat request contains legacy `provider` or `model_name` fields
- **THEN** the service SHALL ignore those fields for routing
- **AND** the service SHALL record a deprecation metric without exposing an error to the shopper

### Requirement: Parallel first-valid provider race
The service SHALL concurrently start one attempt for each configured, eligible provider candidate captured at request start. It SHALL return the first response that passes schema and safety validation, and SHALL cancel or discard all losing attempts.

#### Scenario: One provider answers while others fail or run slowly
- **WHEN** three eligible providers are started for the same chat request
- **AND** one provider returns a valid response before the request deadline
- **THEN** the service SHALL return that valid response without waiting for the other providers
- **AND** late or failed attempts SHALL NOT replace the returned response

### Requirement: Bounded provider attempts
Each provider attempt SHALL observe a configured hard timeout and provider concurrency allowance. Candidates in cooldown, lacking credentials, or at their concurrency limit SHALL NOT be started.

#### Scenario: Provider is already saturated
- **WHEN** a configured provider has reached its concurrency allowance
- **THEN** the request orchestrator SHALL exclude it from the candidate snapshot
- **AND** the orchestrator SHALL continue with the remaining eligible candidates

### Requirement: Validated structured assistant response
The orchestrator SHALL accept a provider result only when it parses as `ZephyrosResponse` and passes configured limits for block count, content size, and action payload validity.

#### Scenario: First provider returns malformed content
- **WHEN** the earliest provider result fails structured-response validation
- **THEN** the orchestrator SHALL classify that attempt as invalid output
- **AND** it SHALL continue awaiting valid results from the remaining candidates

### Requirement: Exactly-once mutation boundary
Provider attempts SHALL be read-only and SHALL only propose mutation actions. A cart or review mutation SHALL execute only after an explicit shopper confirmation through a one-time, user-bound action token and idempotency key.

#### Scenario: Multiple providers propose the same cart action
- **WHEN** parallel provider attempts propose an add-to-cart action
- **THEN** no cart mutation SHALL occur during the provider race
- **AND** one confirmed action token SHALL result in at most one cart mutation

### Requirement: Structured degradation after provider exhaustion
When no eligible provider returns a valid response within the request budget, the service SHALL return a valid structured fallback with available deterministic shopping context and a retry affordance.

#### Scenario: All providers are unavailable
- **WHEN** every candidate fails, times out, or is excluded during a chat request
- **THEN** the service SHALL return a `ZephyrosResponse` containing a plain-language fallback block
- **AND** the response SHALL include a retry action when retrying is safe
