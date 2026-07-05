## ADDED Requirements

### Requirement: Native Cerebras Model Initialization
The backend SHALL instantiate the Cerebras model using Pydantic-AI's `CerebrasModel` class with a `CerebrasProvider` holding the API key.

#### Scenario: Initialize Cerebras model
- **WHEN** the backend builds the Cerebras model
- **THEN** it SHALL return an instance of `CerebrasModel` initialized with `CerebrasProvider`

### Requirement: Default Provider Frontend Preselection
The frontend store SHALL set `'cerebras'` as the default provider on initialization.

#### Scenario: Frontend initializes chat settings
- **WHEN** the user opens the application for the first time
- **THEN** the initial provider value in the Zustand store SHALL default to `'cerebras'`

### Requirement: Disable Options During Pending State
The frontend SHALL disable all option buttons inside the chat widget while `isPending` is true.

#### Scenario: Pending response block option interaction
- **WHEN** the chat status is pending (waiting for AI response)
- **THEN** the clarification options and action buttons SHALL be disabled in the UI
