## ADDED Requirements

### Requirement: Shared provider circuit state
The service SHALL store provider health, cooldown, half-open probe eligibility, failure classification, and in-flight allowance state in Redis so that all service workers use the same routing view.

#### Scenario: Failure is observed by another worker
- **WHEN** one Zephyros worker records a provider timeout that opens its circuit
- **THEN** another worker handling a subsequent request SHALL observe that provider as unavailable until its cooldown or half-open policy permits a probe

### Requirement: Correlated routing telemetry
Every chat request and every provider attempt SHALL emit structured telemetry correlated by request ID, including candidate count, provider outcome class, validation result, selected winner, duration, fallback use, and action execution outcome.

#### Scenario: A raced request succeeds after failures
- **WHEN** one provider fails and a second provider supplies the winning valid response
- **THEN** telemetry SHALL contain the same request ID for both attempts
- **AND** SHALL identify the failed attempt, winning attempt, and end-to-end duration

### Requirement: Availability and latency objectives
The service SHALL publish configurable success-rate and latency objectives for requests with at least two eligible providers, and SHALL expose compliance metrics without claiming absolute third-party availability.

#### Scenario: Provider outage affects the objective
- **WHEN** the rolling successful-response rate or latency percentile falls below its configured objective
- **THEN** monitoring SHALL expose the breach with candidate and failure-class breakdowns

### Requirement: Deterministic resilience verification
The test suite SHALL simulate timeouts, authentication errors, rate limits, malformed outputs, Redis unavailability, internal tool failures, and all-provider exhaustion without contacting real provider APIs.

#### Scenario: Fast valid result wins under injected faults
- **WHEN** tests inject one timeout, one malformed response, and one valid provider response
- **THEN** the test SHALL assert that the valid response is returned once
- **AND** SHALL assert that no mutation tool is invoked by any raced attempt
