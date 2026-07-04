# Capability: cerebras-production-model

## Purpose
Align model configuration with the active Cerebras production model (gpt-oss-120b).

## Requirements

### Requirement: Cerebras Production Model Dropdown Option
The frontend model picker SHALL list `gpt-oss-120b` for `cerebras` provider.

#### Scenario: Select Cerebras model options
- **WHEN** the user selects the "Cerebras Inference" provider in settings
- **THEN** the model dropdown option SHALL show `gpt-oss-120b` as the recommended model

### Requirement: Backend Cerebras Model Setting
The backend environment setting `CEREBRAS_MODEL` SHALL be configured to `gpt-oss-120b`.

#### Scenario: Backend uses production model
- **WHEN** the backend loads settings for the `cerebras` provider
- **THEN** it SHALL resolve `gpt-oss-120b` as the model name
