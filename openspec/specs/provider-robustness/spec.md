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

### Requirement: Valid Gemini Default Model
The configuration default model for Gemini SHALL be set to a valid model identifier.

#### Scenario: Valid Gemini default configuration
- **WHEN** the `GEMINI_MODEL` is resolved
- **THEN** the default value SHALL be `"gemini-3.5-flash"`

### Requirement: Prioritized Provider Chain Default Order
The system SHALL order the automatic fallback candidates chain such that Groq with GPT OSS 20B is tried first, followed by Groq with Llama 3.3, followed by Gemini 3.5 Flash, followed by Cerebras, and lastly OpenRouter.

#### Scenario: Default provider chain ordering
- **WHEN** a client request does not specify a pinned provider (or when the pinned provider fails)
- **THEN** the system SHALL attempt providers in the following order:
  1. `groq-gpt-oss` (Groq with `openai/gpt-oss-20b`)
  2. `groq-llama` (Groq with `llama-3.3-70b-versatile`)
  3. `gemini` (Google with `gemini-3.5-flash`)
  4. `cerebras` (Cerebras with `qwen3`)
  5. `openrouter` (OpenRouter with free tier model)

### Requirement: Failover for Pinned AI Provider Requests
When a specific AI provider is requested by the client, the system SHALL attempt the requested provider first, but fall back to other configured and healthy providers if the requested provider fails.

#### Scenario: Pinned provider rate limit triggers fallback
- **WHEN** a client request specifies a preferred provider
- **AND** the preferred provider returns a rate limit error (429) or is currently marked down
- **THEN** the system SHALL automatically try the next configured provider in the priority chain (e.g., Groq, OpenRouter, Cerebras) rather than failing immediately

