# provider-robustness Specification

## Purpose
TBD - created by archiving change fix-agent-provider-failures. Update Purpose after archive.
## Requirements
### Requirement: Non-XML Tool Calling Format
The LLM system prompt SHALL include strict formatting instructions to forbid outputting custom XML-like tags (e.g. `<function=final_result>` or `<call:...>`) in the text.

#### Scenario: Groq compliance
- **WHEN** a Groq completion request is generated
- **THEN** the model SHALL output tool call parameters natively using the completion API's tool parameters schema instead of inserting XML syntax in the response body

### Requirement: Valid Cerebras Default Model
The configuration default model for Cerebras SHALL be set to a valid model identifier.

#### Scenario: Valid default configuration
- **WHEN** the `CEREBRAS_MODEL` is resolved
- **THEN** the default value SHALL be `"llama-3.3-70b"`

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

### Requirement: Valid Gemini Default Model
The configuration default model for Gemini SHALL be set to a valid model identifier.

#### Scenario: Valid Gemini default configuration
- **WHEN** the `GEMINI_MODEL` is resolved
- **THEN** the default value SHALL be `"gemini-3.5-flash"`

### Requirement: Prioritized Provider Chain Default Order
The server-owned provider registry SHALL assign a deterministic priority for candidate tie-breaking and non-race work: Groq with GPT OSS 20B first, Groq with Llama 3.3 second, Gemini Flash third, Cerebras fourth, and OpenRouter last. Shopper requests SHALL NOT alter this ordering.

#### Scenario: Multiple candidates become valid together
- **WHEN** two provider responses become valid in the same event-loop selection interval
- **THEN** the system SHALL select the response from the candidate with the higher registry priority
- **AND** SHALL record both outcomes in telemetry

### Requirement: Extended Startup Health Probe Timeout
The backend service lifespan startup health probe SHALL use an extended timeout of 10.0 seconds per provider to allow connection setup and model warming without causing premature cooldowns.

#### Scenario: Health probe completes within extended timeout
- **WHEN** the agent service starts up and initiates a health probe to an LLM provider
- **AND** the API call takes 5.0 seconds to return an answer
- **THEN** the probe SHALL succeed and the provider MUST NOT be placed in cooldown

