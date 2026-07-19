## 1. Configuration & Setup

- [x] 1.1 Add `ETL_ADMIN_KEY` environment variable to `services/products_etl/.env` and `.env.example`
- [x] 1.2 Add `ETL_ADMIN_KEY` to `services/products_etl/internal/config/config.go` Config struct
- [x] 1.3 Verify `ETL_ADMIN_KEY` is loaded from environment in config.LoadConfig()

## 2. Scheduler Control State

- [x] 2.1 Add `schedulerEnabled` atomic.Bool package-level variable in `main.go`
- [x] 2.2 Initialize `schedulerEnabled` to `true` at startup
- [x] 2.3 Wrap scheduler goroutine with `schedulerEnabled.Load()` check before each cycle
- [x] 2.4 Add `isSchedulerRunning()` helper function to return current state

## 3. Admin Control Endpoint

- [x] 3.1 Create `POST /admin/etl/control` HTTP handler function `etlControlHandler`
- [x] 3.2 Implement API key validation middleware using `X-Admin-Key` header
- [x] 3.3 Implement `action` parsing from JSON request body (`start` | `stop`)
- [x] 3.4 Implement `stop` action: set `schedulerEnabled` to false, publish `etl_stopped` event
- [x] 3.5 Implement `start` action: set `schedulerEnabled` to true, publish `etl_resumed` event
- [x] 3.6 Implement invalid action handling (HTTP 400 response)
- [x] 3.7 Register the new handler in the HTTP mux in `main()`
- [x] 3.8 Add Swagger annotations for the new endpoint

## 4. Health Endpoint Enhancement

- [x] 4.1 Modify `healthHandler` to include `etl_running` field in response
- [x] 4.2 Update health response JSON structure to `{"status":"ok","mongodb":"ok","etl_running":true}`
- [x] 4.3 Update Swagger annotations for health endpoint

## 5. Audit Event Publishing

- [x] 5.1 Add `etl_stopped` event publish in `etlControlHandler` stop action
- [x] 5.2 Add `etl_resumed` event publish in `etlControlHandler` start action
- [x] 5.3 Add `etl_cycle_started` event publish at beginning of `runSchedulerCheck()`
- [x] 5.4 Add `etl_cycle_completed` event publish at end of successful `runSchedulerCheck()`
- [x] 5.5 Add `etl_cycle_failed` event publish on error paths in `runSchedulerCheck()`
- [x] 5.6 Verify all events use correct structure: actor=`products_etl`, entity_type=`service`, entity_id=`products_etl`

## 6. Gateway Proxy (Optional)

- [x] 6.1 Add proxy route in `services/gateway/app/api/routes/admin.py` for `/api/v1/admin/etl/control`
- [x] 6.2 Verify gateway forwards `X-Admin-Key` header to upstream

## 7. Testing & Documentation

- [x] 7.1 Test stop endpoint locally: verify scheduler pauses, health shows `etl_running: false`
- [x] 7.2 Test start endpoint locally: verify scheduler resumes, audit event published
- [x] 7.3 Test invalid API key returns 401
- [x] 7.4 Test invalid action returns 400
- [x] 7.5 Verify audit events appear in `audit_logs` table via `/admin/audit` endpoint
- [x] 7.6 Update Swagger documentation at `/docs/` endpoint
