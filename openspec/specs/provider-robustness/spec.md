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
The AI agent system SHALL track failures of AI providers. If a call to a provider fails (e.g. due to rate limits, API timeouts, auth errors, or internal server errors), that provider SHALL be marked as unhealthy/blocked for a configurable window (defaulting to 5 minutes) to avoid subsequent failed attempts.

#### Scenario: Provider failure triggers block
- **WHEN** a completion call to a provider fails with an API/network exception
- **THEN** the system SHALL add the provider to the blocked list, generate a warning audit log, and return the error to trigger a fallback

### Requirement: Provider Chain Fallback Routing
The system SHALL automatically select the first healthy (non-blocked) provider from the available provider chain. If a call to the selected provider fails, the system SHALL attempt the call on the next healthy provider in the prioritized list.

#### Scenario: Routing bypasses blocked providers
- **WHEN** a request is initiated and the first provider in the list is currently blocked
- **THEN** the system SHALL skip the blocked provider and send the request to the next available provider in the chain

