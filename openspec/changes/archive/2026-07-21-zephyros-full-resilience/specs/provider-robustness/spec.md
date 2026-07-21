## MODIFIED Requirements

### Requirement: Prioritized Provider Chain Default Order
The system SHALL order the automatic fallback candidates chain such that Groq with GPT OSS 20B is tried first, followed by Groq with Llama 3.3, Gemini 3.5 Flash, Cerebras with a valid production model, and lastly OpenRouter.

#### Scenario: Default provider chain ordering
- **WHEN** a client request does not specify a pinned provider (or when the pinned provider fails)
- **THEN** the system SHALL attempt providers in the following order:
  1. `groq-gpt-oss` (Groq with `openai/gpt-oss-20b`)
  2. `groq-llama` (Groq with `llama-3.3-70b-versatile` or `llama3-70b`)
  3. `gemini` (Google with `gemini-3.5-flash`)
  4. `cerebras` (Cerebras with `gpt-oss-120b`)
  5. `openrouter` (OpenRouter with free tier model)

## ADDED Requirements

### Requirement: Extended Startup Health Probe Timeout
The backend service lifespan startup health probe SHALL use an extended timeout of 10.0 seconds per provider to allow connection setup and model warming without causing premature cooldowns.

#### Scenario: Health probe completes within extended timeout
- **WHEN** the agent service starts up and initiates a health probe to an LLM provider
- **AND** the API call takes 5.0 seconds to return an answer
- **THEN** the probe SHALL succeed and the provider MUST NOT be placed in cooldown
