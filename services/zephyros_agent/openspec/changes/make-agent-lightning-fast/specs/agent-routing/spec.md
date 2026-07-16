## MODIFIED Requirements

### Requirement: OpenRouter Primary Provider
The system SHALL use Groq and Gemini as the primary AI providers and SHALL NOT use OpenRouter by default unless explicitly requested or when primary providers fail.

#### Scenario: Model initialization
- **WHEN** the agent starts and provider chain auto-selection is executed
- **THEN** the system SHALL prioritize Groq and Gemini (using fast models like `llama-3.1-8b-instant` and `gemini-2.5-flash`) over OpenRouter in the auto-selected provider chain

### Requirement: AI Provider Fallback Chain
The system SHALL attempt to use Groq first, then Gemini, and only use OpenRouter as a fallback if the primary providers fail or are unconfigured.

#### Scenario: Fallback to next provider on API failure
- **WHEN** the primary Groq/Gemini providers return a rate limit or connection error
- **THEN** the system SHALL fall back to OpenRouter or other available providers in the chain
