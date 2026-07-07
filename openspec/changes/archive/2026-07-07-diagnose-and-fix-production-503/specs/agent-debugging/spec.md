## ADDED Requirements

### Requirement: Startup Config Diagnostics Logging
The agent service SHALL log the list of configured providers on lifespan startup to allow verification of Doppler/env keys injection.

#### Scenario: Startup initialization log
- **WHEN** the agent starts up
- **THEN** it SHALL write a log entry showing the available providers chain list (names only)
