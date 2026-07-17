## ADDED Requirements

### Requirement: OpenRouter Primary Provider
The system SHALL use OpenRouter as the primary AI provider and default to `openai/gpt-oss-120b:free`.

#### Scenario: Model initialization
- **WHEN** the agent starts and `OPENROUTER_API_KEY` is configured
- **THEN** OpenRouter SHALL be used as the primary provider with the model `openai/gpt-oss-120b:free`

### Requirement: AI Provider Fallback Chain
The system SHALL fall back to alternative providers (Gemini, Groq, Cerebras) in order if the primary provider fails.

#### Scenario: Fallback to next provider on API failure
- **WHEN** the primary OpenRouter provider returns a rate limit or connection error
- **THEN** the system SHALL attempt the request with the next provider in the chain (Gemini, then Groq, then Cerebras)
