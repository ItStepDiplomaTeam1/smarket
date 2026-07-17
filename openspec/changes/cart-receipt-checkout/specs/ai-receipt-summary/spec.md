## ADDED Requirements

### Requirement: AI receipt summary endpoint
The `zephyros_agent` service SHALL expose a new endpoint `POST /agent/summarize-plan` that accepts structured receipt data and returns a short Ukrainian-language description (2-3 sentences). This endpoint MUST use a direct model call (no `Agent` with tools) and SHALL reuse the existing provider fallback chain from `build_model()`.

#### Scenario: Successful generation
- **WHEN** `POST /agent/summarize-plan` receives valid input `{"store_name": str, "items_count": int, "total_price": float, "savings_amount": float}`
- **WHEN** at least one provider is available and responds within timeout
- **THEN** system returns HTTP 200 with `{"text": "<2-3 sentences in Ukrainian>"}`

#### Scenario: All providers unavailable or in cooldown
- **WHEN** all providers are in cooldown or fail
- **THEN** system returns HTTP 503 immediately without waiting for timeouts to expire
- **THEN** caller (cart_service background task) treats this as "no AI description" and does not retry

#### Scenario: Single provider timeout
- **WHEN** one provider exceeds the configured timeout (2-4 seconds)
- **THEN** system falls back to the next available provider
- **WHEN** all providers exhaust their retries
- **THEN** system returns HTTP 503

### Requirement: AI summary content constraints
The AI-generated summary SHALL be written in Ukrainian. The system prompt SHALL instruct the model:
- Write 2-3 short sentences in a light tone with occasional humor
- Humor MAY reference: savings amount, number of items, the shopping process in general
- Humor MUST NOT reference or comment on specific products in the list (products can be personal)
- No emoji, no exclamation marks in every sentence
- No branding language, no "ви заощадили" as first words (the hero block already shows this)

#### Scenario: Generated text length
- **WHEN** generation succeeds
- **THEN** `text` field contains 2-3 sentences
- **THEN** `text` length is under 400 characters

### Requirement: AI summary timeout constraint
The endpoint SHALL enforce a strict request timeout of 4 seconds per provider attempt. The total wall-clock time for the endpoint MUST NOT exceed 12 seconds (3 providers × 4 seconds).

#### Scenario: Timeout enforcement
- **WHEN** the model call exceeds 4 seconds
- **THEN** the request to that provider is cancelled
- **THEN** the next provider in the chain is attempted
