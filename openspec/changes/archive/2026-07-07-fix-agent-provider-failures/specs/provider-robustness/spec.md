## ADDED Requirements

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
