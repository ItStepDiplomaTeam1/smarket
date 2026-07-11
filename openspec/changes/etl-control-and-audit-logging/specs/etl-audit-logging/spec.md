## ADDED Requirements

### Requirement: ETL service started event
The system SHALL publish an `etl_started` audit event when the ETL service starts.

#### Scenario: Service startup event
- **WHEN** the ETL service starts successfully
- **THEN** the system publishes an audit event with event_type `etl_started`, actor `products_etl`, severity `info`, and message "Products ETL Service started"

### Requirement: ETL service stopped event
The system SHALL publish an `etl_stopped` audit event when the ETL scheduler is stopped via the control endpoint.

#### Scenario: Admin stops ETL
- **WHEN** an authorized user sends `POST /admin/etl/control` with body `{"action": "stop"}`
- **THEN** the system publishes an audit event with event_type `etl_stopped`, actor `products_etl`, severity `info`, and message "ETL scheduler stopped by admin"

### Requirement: ETL service resumed event
The system SHALL publish an `etl_resumed` audit event when the ETL scheduler is started via the control endpoint.

#### Scenario: Admin starts ETL
- **WHEN** an authorized user sends `POST /admin/etl/control` with body `{"action": "start"}`
- **THEN** the system publishes an audit event with event_type `etl_resumed`, actor `products_etl`, severity `info`, and message "ETL scheduler resumed by admin"

### Requirement: ETL cycle started event
The system SHALL publish an `etl_cycle_started` audit event when a new ETL cycle begins.

#### Scenario: Scheduler begins a cycle
- **WHEN** the scheduler starts processing a new ETL cycle
- **THEN** the system publishes an audit event with event_type `etl_cycle_started`, actor `products_etl`, severity `info`, and message "Розпочато цикл збору даних"

#### Scenario: Cycle started with store count
- **WHEN** the scheduler finds stale stores and queues them
- **THEN** the audit event details include `queued_stores` count

### Requirement: ETL cycle completed event
The system SHALL publish an `etl_cycle_completed` audit event when an ETL cycle finishes successfully.

#### Scenario: Cycle finishes successfully
- **WHEN** the scheduler completes processing all queued stores without errors
- **THEN** the system publishes an audit event with event_type `etl_cycle_completed`, actor `products_etl`, severity `info`, and message "Завершено цикл планування. Додано у чергу N магазинів"
- **THEN** the event details include `queued_stores` count

### Requirement: ETL cycle failed event
The system SHALL publish an `etl_cycle_failed` audit event when an ETL cycle encounters errors.

#### Scenario: Scheduler query fails
- **WHEN** the scheduler fails to query the database for stale stores
- **THEN** the system publishes an audit event with event_type `etl_cycle_failed`, actor `products_etl`, severity `error`, and message containing the error description

#### Scenario: RabbitMQ publish fails
- **WHEN** the scheduler fails to publish a task to RabbitMQ
- **THEN** the system publishes an audit event with event_type `etl_cycle_failed`, actor `products_etl`, severity `error`, and message containing the error description

### Requirement: Audit event structure compliance
The system SHALL publish audit events that comply with the `AuditEventMessage` schema.

#### Scenario: Event message format
- **WHEN** the system publishes any audit event
- **THEN** the event includes all required fields: `event_id`, `timestamp`, `actor`, `event_type`, `entity_type`, `entity_id`, `message`, `details`, `severity`
- **THEN** the `actor` field is set to `products_etl`
- **THEN** the `entity_type` field is set to `service`
- **THEN** the `entity_id` field is set to `products_etl`
- **THEN** the `severity` field is one of: `info`, `warning`, `error`, `critical`
