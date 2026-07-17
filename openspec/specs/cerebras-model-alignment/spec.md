# Capability: cerebras-model-alignment

## Purpose
Align the Cerebras model identifier across both frontend select dropdowns and backend environment variables.

## Requirements

### Requirement: Cerebras Provider Model Option
The frontend SHALL present a valid Cerebras model `llama-3.3-70b` instead of the incorrect `gpt-oss-120b` in the provider configuration dropdown options.

#### Scenario: Select Cerebras in settings
- **WHEN** the user opens the settings and selects the "Cerebras Inference" provider
- **THEN** the model dropdown option SHALL show "llama-3.3-70b" as the recommended model instead of "gpt-oss-120b"

### Requirement: Backend Cerebras Model Config
The backend service configuration SHALL default to `llama-3.3-70b` for Cerebras provider and load it correctly from the environment variables.

#### Scenario: Backend resolves Cerebras model
- **WHEN** the backend builds the Cerebras model from settings with `CEREBRAS_MODEL` environment variable
- **THEN** it SHALL resolve to "llama-3.3-70b" and make API requests with this model identifier
