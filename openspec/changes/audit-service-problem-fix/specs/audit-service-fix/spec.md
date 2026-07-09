## ADDED Requirements

### Requirement: audit_service local and production startup
The system SHALL start `audit_service` successfully in both local and production Docker environments.

#### Scenario: Local startup is successful
- **WHEN** `docker compose -f infra/docker-compose.local.yml up` is run
- **THEN** the `audit_service` starts up on port 8006 using the `src.main:app` module path

#### Scenario: Production startup is successful
- **WHEN** the `audit_service` container starts in production
- **THEN** it imports `orjson` and runs without missing dependency errors
