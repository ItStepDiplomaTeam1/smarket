## ADDED Requirements

### Requirement: Agent Service Healthy Build
The agent service docker image SHALL be built with all runtime dependencies (including `orjson`, `granian`, and `pydantic-settings`).

#### Scenario: Healthcheck verification
- **WHEN** the container starts and `/health` is queried
- **THEN** it SHALL return a `200 OK` response with `status: ok`

### Requirement: AI Provider Keys Injection
The agent service environment SHALL contain at least one configured API key from the supported providers (OpenRouter, Gemini, Groq, Cerebras).

#### Scenario: Provider verification
- **WHEN** a POST request to `/agent/chat` is made
- **THEN** the system SHALL select a valid provider from the chain instead of failing immediately with an empty candidate pool
