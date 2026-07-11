## ADDED Requirements

### Requirement: ETL control endpoint authentication
The system SHALL protect the ETL control endpoint with API key authentication via the `X-Admin-Key` HTTP header.

#### Scenario: Valid API key provided
- **WHEN** a request is sent to `POST /admin/etl/control` with a valid `X-Admin-Key` header
- **THEN** the system processes the request and returns the appropriate response

#### Scenario: Missing API key
- **WHEN** a request is sent to `POST /admin/etl/control` without the `X-Admin-Key` header
- **THEN** the system returns HTTP 401 with error `{"error": "unauthorized", "detail": "Missing or invalid API key"}`

#### Scenario: Invalid API key
- **WHEN** a request is sent to `POST /admin/etl/control` with an incorrect `X-Admin-Key` header value
- **THEN** the system returns HTTP 401 with error `{"error": "unauthorized", "detail": "Missing or invalid API key"}`

### Requirement: ETL scheduler stop control
The system SHALL allow an authorized user to stop the ETL scheduler via the control endpoint.

#### Scenario: Stop a running ETL
- **WHEN** a `POST /admin/etl/control` request is sent with body `{"action": "stop"}` and a valid API key
- **WHEN** the ETL scheduler is currently running
- **THEN** the system sets the scheduler enabled flag to false
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "etl_running": false, "message": "ETL scheduler stopped"}`
- **THEN** the system publishes an `etl_stopped` audit event to the `smarket_events` exchange

#### Scenario: Stop an already stopped ETL
- **WHEN** a `POST /admin/etl/control` request is sent with body `{"action": "stop"}` and a valid API key
- **WHEN** the ETL scheduler is already stopped
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "etl_running": false, "message": "ETL scheduler already stopped"}`

### Requirement: ETL scheduler start control
The system SHALL allow an authorized user to start the ETL scheduler via the control endpoint.

#### Scenario: Start a stopped ETL
- **WHEN** a `POST /admin/etl/control` request is sent with body `{"action": "start"}` and a valid API key
- **WHEN** the ETL scheduler is currently stopped
- **THEN** the system sets the scheduler enabled flag to true
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "etl_running": true, "message": "ETL scheduler started"}`
- **THEN** the system publishes an `etl_resumed` audit event to the `smarket_events` exchange

#### Scenario: Start an already running ETL
- **WHEN** a `POST /admin/etl/control` request is sent with body `{"action": "start"}` and a valid API key
- **WHEN** the ETL scheduler is already running
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "etl_running": true, "message": "ETL scheduler already running"}`

### Requirement: Invalid action handling
The system SHALL reject control requests with unrecognized actions.

#### Scenario: Unknown action value
- **WHEN** a `POST /admin/etl/control` request is sent with body `{"action": "unknown_action"}` and a valid API key
- **THEN** the system returns HTTP 400 with error `{"error": "bad_request", "detail": "Invalid action. Allowed: start, stop"}`

### Requirement: Health endpoint reflects ETL state
The system SHALL include the ETL running state in the health check response.

#### Scenario: Health check when ETL is running
- **WHEN** a `GET /health` request is sent while the ETL scheduler is running
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "mongodb": "ok", "etl_running": true}`

#### Scenario: Health check when ETL is stopped
- **WHEN** a `GET /health` request is sent while the ETL scheduler is stopped
- **THEN** the system returns HTTP 200 with body `{"status": "ok", "mongodb": "ok", "etl_running": false}`

### Requirement: MongoDB remains running when ETL is paused
The system SHALL keep MongoDB running even when the ETL scheduler is stopped.

#### Scenario: MongoDB availability after ETL stop
- **WHEN** the ETL scheduler is stopped via the control endpoint
- **THEN** MongoDB continues to run and accepts connections
- **THEN** the health endpoint still checks MongoDB connectivity
