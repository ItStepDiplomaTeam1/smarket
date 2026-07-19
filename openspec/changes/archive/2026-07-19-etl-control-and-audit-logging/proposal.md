## Why

Currently, the `products_etl` service runs continuously with no way to pause or stop it except by restarting the Docker container. This makes maintenance difficult—you can't gracefully stop ETL cycles, update the service, or troubleshoot issues without disrupting the entire pipeline. Additionally, there's no centralized visibility into ETL lifecycle events (startup, shutdown, cycle completion, errors) in the audit service, making operational monitoring and debugging harder.

## What Changes

- Add a **secured HTTP endpoint** (`POST /admin/etl/control`) to `products_etl` that accepts `{"action": "start" | "stop"}` commands. This endpoint will be protected by API key authentication to prevent unauthorized access.
- When the ETL is **stopped**, the scheduler goroutine pauses and the service stops processing new tasks. When **started**, the scheduler resumes.
- The **MongoDB container** will be managed alongside ETL state: when ETL is stopped, MongoDB should also be stopped (and restarted when ETL resumes). This is achieved through Docker Compose orchestration or an external control mechanism.
- `products_etl` will **publish audit events** to the `smarket_events` exchange for all lifecycle transitions:
  - `etl_started` — service started
  - `etl_stopped` — service stopped gracefully
  - `etl_cycle_started` — a new ETL cycle begins
  - `etl_cycle_completed` — a cycle finished successfully
  - `etl_cycle_failed` — a cycle encountered errors
  - `etl_health_check` — periodic health status
- The `audit_service` will consume and store these events (it already subscribes to `smarket_events` with routing key `#`).

## Capabilities

### New Capabilities
- `etl-admin-control`: Secured endpoint to start/stop the ETL pipeline and manage MongoDB lifecycle alongside it.
- `etl-audit-logging`: Structured audit events for all ETL lifecycle transitions (startup, shutdown, cycle start/complete/fail).

### Modified Capabilities
- `audit-service-fix`: Extend the existing audit service spec to include ETL lifecycle event types as a known event category.

## Impact

- **`services/products_etl/`**: Add new HTTP handler, API key auth middleware, state management for scheduler, and additional `PublishEvent` calls.
- **`services/audit_service/`**: No code changes needed (already consumes all `smarket_events`), but may need schema validation updates if new event types require validation.
- **`infra/docker-compose.yml`** and **`infra/docker-compose.local.yml`**: May need modifications if MongoDB lifecycle is managed via Docker Compose profiles or external scripts.
- **New dependency**: `products_etl` will need an API key configuration (via `.env`).
- **Docker networking**: The control endpoint must be accessible from the gateway or admin interface (port exposure changes).
