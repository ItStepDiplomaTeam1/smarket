## MODIFIED Requirements

### Requirement: AI Provider Health Check & Temporary Blocking
The AI agent system SHALL track provider-attributable failures in Redis. A timeout, rate limit, provider 5xx, permanent authentication/configuration error, or invalid structured output SHALL update the provider's shared health state and apply a configurable cooldown or permanent-disable policy. Local dependency failures SHALL NOT block an otherwise healthy provider.

#### Scenario: Provider failure is shared across workers
- **WHEN** any worker receives a provider-attributable timeout or rate-limit error
- **THEN** the system SHALL atomically record the classified failure in shared state
- **AND** subsequent workers SHALL exclude the provider until its cooldown or half-open policy permits a probe

### Requirement: Provider Chain Fallback Routing
The system SHALL automatically select from eligible configured providers through a concurrent first-valid response race. The registry priority SHALL only determine tie-breaking and non-race ordering; the system SHALL NOT wait for one eligible provider to fail before starting another.

#### Scenario: Routing does not wait for a failed primary provider
- **WHEN** a chat request has multiple eligible providers
- **THEN** the system SHALL start all eligible candidates concurrently
- **AND** SHALL return the first schema-valid response without waiting for a slower or failed higher-priority candidate

### Requirement: Prioritized Provider Chain Default Order
The server-owned provider registry SHALL assign a deterministic priority for candidate tie-breaking and non-race work: Groq with GPT OSS 20B first, Groq with Llama 3.3 second, Gemini Flash third, Cerebras fourth, and OpenRouter last. Shopper requests SHALL NOT alter this ordering.

#### Scenario: Multiple candidates become valid together
- **WHEN** two provider responses become valid in the same event-loop selection interval
- **THEN** the system SHALL select the response from the candidate with the higher registry priority
- **AND** SHALL record both outcomes in telemetry

## REMOVED Requirements

### Requirement: Failover for Pinned AI Provider Requests
**Reason**: Shopper-pinned provider selection creates avoidable failures and conflicts with automatic, reliable routing.

**Migration**: Clients stop sending provider preferences; the backend ignores legacy fields during the compatibility window and routes from the server-owned registry.
