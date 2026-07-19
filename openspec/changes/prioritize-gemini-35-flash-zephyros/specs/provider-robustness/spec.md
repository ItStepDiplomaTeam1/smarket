## ADDED Requirements

### Requirement: Valid Gemini Default Model
The configuration default model for Gemini SHALL be set to a valid model identifier.

#### Scenario: Valid Gemini default configuration
- **WHEN** the `GEMINI_MODEL` is resolved
- **THEN** the default value SHALL be `"gemini-3.5-flash"`

### Requirement: Prioritized Provider Chain Default Order
The default provider priority order in `PROVIDER_CHAIN` SHALL place Gemini as the first candidate.

#### Scenario: Default provider chain ordering
- **WHEN** the available provider chain is resolved without client override
- **THEN** the chain order SHALL be `["gemini", "groq", "openrouter", "cerebras"]`
