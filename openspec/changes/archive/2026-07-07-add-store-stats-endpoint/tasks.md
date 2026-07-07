## 1. Schema Definition

- [x] 1.1 Add `StoreStatsResponse` schema class to `services/product_service/app/shared/schemas.py`.

## 2. API Endpoint Implementation

- [x] 2.1 Add the route `GET /api/v1/stores/{store_id}/stats` to `services/product_service/app/routers/stores.py`.
- [x] 2.2 Implement the SQL query using `text()` wrapper in `get_store_stats` with store existence check.

## 3. Verification

- [x] 3.1 Verify the endpoint works via FastAPI's interactive Swagger UI documentation.
