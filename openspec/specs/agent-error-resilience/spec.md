# agent-error-resilience Specification

## Purpose
TBD - created by archiving change fix-zephyros-timeout-handling. Update Purpose after archive.
## Requirements
### Requirement: Frontend request timeout matches backend capacity
The frontend AI chat API hook SHALL use a timeout of 120000ms (120 seconds) for the agent chat request, matching the gateway's agent proxy timeout.

#### Scenario: Slow query completes within timeout
- **WHEN** user sends a complex query requiring multiple tool calls
- **AND** the agent takes 60-90 seconds to respond
- **THEN** the frontend SHALL wait for the full response without aborting

#### Scenario: Request exceeds maximum timeout
- **WHEN** the agent does not respond within 120 seconds
- **THEN** the frontend SHALL abort the request and display a timeout error message

### Requirement: Gateway catches all httpx exceptions
The gateway agent proxy SHALL catch all httpx exception types and return structured error JSON responses. Specific exception types SHALL be caught first (ReadTimeout, ConnectError, ConnectTimeout) followed by a general httpx.HTTPError catch-all.

#### Scenario: Agent read timeout
- **WHEN** the gateway sends a request to the agent
- **AND** the agent does not respond within the timeout
- **THEN** the gateway SHALL return HTTP 504 with `{"error": "agent_timeout", "detail": "Сервіс агента не відповів вчасно"}`

#### Scenario: Agent connection error
- **WHEN** the gateway cannot establish a TCP connection to the agent
- **THEN** the gateway SHALL return HTTP 503 with `{"error": "agent_unavailable", "detail": "Сервіс агента недоступний"}`

#### Scenario: Agent connection timeout
- **WHEN** the TCP connection to the agent cannot be established within the timeout
- **THEN** the gateway SHALL return HTTP 504 with `{"error": "agent_timeout", "detail": "Сервіс агента не відповів вчасно"}`

#### Scenario: Unexpected httpx error
- **WHEN** any other httpx exception occurs (WriteError, PoolTimeout, RemoteProtocolError, etc.)
- **THEN** the gateway SHALL return HTTP 502 with `{"error": "agent_error", "detail": "Помилка з'єднання з агентом"}`

### Requirement: Agent returns distinct error responses per failure mode
The agent endpoint SHALL return different HTTP status codes, error types, and user-safe detail messages for each failure category. The error type field SHALL be a machine-readable string. The detail field SHALL be a safe Ukrainian-language message suitable for display to end users.

#### Scenario: No providers configured
- **WHEN** the agent has no AI provider API keys configured
- **THEN** the agent SHALL return HTTP 503 with `{"error": "no_providers", "detail": "ШІ-провайдери не налаштовані на сервері"}`

#### Scenario: Provider authentication error
- **WHEN** a provider returns HTTP 401 (invalid API key)
- **AND** all other providers are also exhausted or in cooldown
- **THEN** the agent SHALL return HTTP 502 with `{"error": "provider_auth_error", "detail": "Помилка автентифікації ШІ-провайдера. Зверніться до адміністратора."}`

#### Scenario: Provider rate limited
- **WHEN** a provider returns HTTP 429 (rate limited)
- **AND** all other providers are also exhausted or in cooldown
- **THEN** the agent SHALL return HTTP 429 with `{"error": "provider_rate_limited", "detail": "Забагато запитів до ШІ-провайдера. Спробуйте за хвилину."}`

#### Scenario: Provider HTTP error
- **WHEN** a provider returns any other HTTP error (500, 502, 503, etc.)
- **AND** all other providers are also exhausted or in cooldown
- **THEN** the agent SHALL return HTTP 502 with `{"error": "provider_http_error", "detail": "ШІ-провайдер тимчасово недоступний. Спробуйте інший провайдер."}`

#### Scenario: Response validation error
- **WHEN** the provider returns a response that fails Pydantic validation
- **AND** all other providers are also exhausted or in cooldown
- **THEN** the agent SHALL return HTTP 502 with `{"error": "response_parse_error", "detail": "Агент повернув некоректну відповідь. Спробуйте ще раз."}`

#### Scenario: All providers exhausted
- **WHEN** all candidate providers have been tried and failed
- **THEN** the agent SHALL return HTTP 503 with `{"error": "all_providers_exhausted", "detail": "Усі ШІ-провайдери тимчасово недоступні. Спробуйте за хвилину."}`

### Requirement: Frontend extracts and displays structured error messages
The frontend error handler SHALL parse the error response body from the gateway and display the `detail` field as a fallback block in the chat. The full error object SHALL be logged to `console.error` for developer debugging.

#### Scenario: Gateway returns structured error
- **WHEN** the agent request fails with HTTP 4xx or 5xx
- **AND** the response body contains `{"error": "...", "detail": "..."}`
- **THEN** the frontend SHALL display a fallback block with the `detail` message
- **AND** the frontend SHALL log the full error object to `console.error`

#### Scenario: Gateway returns unstructured error
- **WHEN** the agent request fails with HTTP 4xx or 5xx
- **AND** the response body does not contain a `detail` field
- **THEN** the frontend SHALL display a generic fallback message
- **AND** the frontend SHALL log the full error to `console.error`

#### Scenario: Network error (no response)
- **WHEN** the agent request fails due to network connectivity issues
- **THEN** the frontend SHALL display "Перевірте підключення до інтернету"
- **AND** the frontend SHALL log the error to `console.error`

