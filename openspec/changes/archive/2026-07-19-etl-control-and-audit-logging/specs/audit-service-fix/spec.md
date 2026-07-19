## MODIFIED Requirements

### Requirement: audit_service local and production startup
The system SHALL start `audit_service` successfully in both local and production Docker environments.

#### Scenario: Local startup is successful
- **WHEN** `docker compose -f infra/docker-compose.local.yml up` is run
- **THEN** the `audit_service` starts up on port 8006 using the `src.main:app` module path

#### Scenario: Production startup is successful
- **WHEN** the `audit_service` container starts in production
- **THEN** it imports `orjson` and runs without missing dependency errors

#### Scenario: ETL lifecycle events are consumed
- **WHEN** the `audit_service` is running and receives ETL lifecycle events (`etl_started`, `etl_stopped`, `etl_resumed`, `etl_cycle_started`, `etl_cycle_completed`, `etl_cycle_failed`) from the `smarket_events` exchange
- **THEN** the events are stored in the `audit_logs` table with the correct `actor`, `event_type`, `message`, and `severity` fields
