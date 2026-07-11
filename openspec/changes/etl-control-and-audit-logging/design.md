## Context

The `products_etl` service is a Go application that periodically scrapes Zakaz.ua, stores raw data in MongoDB, transforms it, and upserts into PostgreSQL + Meilisearch. It currently runs as a monolithic process with three goroutines: Scheduler, ExtractLoadWorker, and TransformLoadWorker. There's no way to pause or control the ETL except by restarting the container.

The `audit_service` already consumes all events from the `smarket_events` RabbitMQ exchange (routing key `#`) and stores them in PostgreSQL. The ETL already publishes some lifecycle events (`service_started`, `etl_started`, `etl_finished`) via `PublishEvent()`.

**Current state:**
- ETL runs continuously, scheduler fires every 2 hours
- No admin endpoint for control
- MongoDB is always running (used only by ETL as datalake)
- Some audit events already published, but not comprehensive

## Goals / Non-Goals

**Goals:**
- Provide a secured HTTP endpoint (`POST /admin/etl/control`) to start/stop the ETL scheduler
- Protect the endpoint with API key authentication
- Publish comprehensive audit events for all ETL lifecycle transitions
- Keep MongoDB running when ETL is paused (simpler, low overhead when idle)
- Ensure the health endpoint reflects ETL running state

**Non-Goals:**
- MongoDB container lifecycle management via Docker API (complex, fragile)
- Dynamic reconfiguration of ETL intervals
- Real-time WebSocket status streaming
- Multi-tenant ETL control

## Decisions

### 1. Authentication: API Key via `X-Admin-Key` Header

**Decision:** Use a shared API key passed via `X-Admin-Key` HTTP header.

**Rationale:**
- Simple to implement in Go's `net/http`
- No JWT/OAuth dependency needed for internal admin endpoint
- Consistent with existing patterns (gateway uses `X-User-Id`)
- Key stored in `.env` file, injected via environment variable

**Alternatives considered:**
- JWT auth: Overkill for internal admin endpoint, requires auth_service dependency
- Basic auth: Less standard, harder to rotate
- mTLS: Too complex for this use case

### 2. Scheduler Control: Atomic Boolean Flag

**Decision:** Use `sync/atomic` boolean to control scheduler execution.

**Rationale:**
- Goroutine-safe without mutex overhead
- Scheduler checks flag before each cycle
- Simple, idiomatic Go
- No channel complexity

**Implementation:**
```go
var schedulerEnabled atomic.Bool // true = running

func schedulerLoop() {
    for range ticker.C {
        if !schedulerEnabled.Load() {
            log.Println("[Scheduler] Paused, skipping cycle")
            continue
        }
        runSchedulerCheck()
    }
}
```

### 3. MongoDB Lifecycle: Keep Running

**Decision:** Leave MongoDB running when ETL is paused.

**Rationale:**
- MongoDB idle memory usage is minimal (~50MB)
- Avoids complexity of Docker socket mounting or external orchestration
- MongoDB is only used by ETL, so no other services are affected
- Can be manually stopped via `docker compose stop mongodb` if needed
- Simpler rollback and debugging

**Alternatives considered:**
- Docker socket mounting: Fragile, security risk, complex
- External script: Requires additional deployment complexity
- Docker Compose profiles: Would require significant refactor

### 4. Event Publishing: Extend Existing `PublishEvent` Function

**Decision:** Reuse the existing `PublishEvent()` function with new event types.

**Rationale:**
- Function already handles RabbitMQ channel creation, exchange declaration, and publishing
- Just need to add new event type constants
- Consistent with existing event structure
- Audit service already consumes all events

**New event types:**
- `etl_stopped` — when admin stops ETL
- `etl_resumed` — when admin starts ETL
- `etl_cycle_started` — when scheduler begins a cycle
- `etl_cycle_completed` — when cycle finishes successfully
- `etl_cycle_failed` — when cycle encounters errors
- `etl_health_check` — periodic status (optional)

### 5. Endpoint Design: REST API

**Decision:** `POST /admin/etl/control` with JSON body `{"action": "start" | "stop"}`.

**Rationale:**
- RESTful, consistent with existing `/health` and `/backfill` endpoints
- JSON body is extensible (can add more actions later)
- Swagger documentation will be auto-generated

**Response:**
```json
{
  "status": "ok",
  "etl_running": true,
  "message": "ETL scheduler started"
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| API key leaked in logs | Mask key in logs, use `X-Admin-Key` header (not query param) |
| Scheduler stops mid-cycle | Current cycle completes, only next cycle is skipped |
| MongoDB disk usage grows when ETL paused | Existing ofelia cron cleans old documents; document manual cleanup |
| Health endpoint shows "ok" even when ETL paused | Add `etl_running` field to health response |
| Race condition between start/stop | Use atomic operations; document that rapid toggling is not supported |

## Migration Plan

1. **Add API key config** to `products_etl/.env` and `.env.example`
2. **Add new HTTP handler** for `/admin/etl/control`
3. **Add atomic flag** for scheduler control
4. **Wrap scheduler** with flag check
5. **Add audit events** for all transitions
6. **Update health endpoint** to include ETL running state
7. **Update Swagger docs** with new endpoint
8. **Test locally** with `docker compose -f infra/docker-compose.local.yml up`
9. **Deploy to production** via CI/CD

**Rollback:** Remove the new handler and atomic flag; existing behavior resumes.

## Open Questions

1. Should the `/admin/etl/control` endpoint be exposed through the gateway, or accessed directly on port 8082?
2. Should we add rate limiting to the control endpoint?
3. Should we publish `etl_health_check` events periodically, or only on state changes?
