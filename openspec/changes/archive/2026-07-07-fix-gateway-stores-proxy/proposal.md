## Why

GET requests proxied through the API Gateway stores router to `product_service` fail with HTTP 422 (Unprocessable Entity). This is because the gateway currently forwards the request stream (`request.stream()`) as the request content for all proxied methods, including GET. Downstream ASGI servers (FastAPI/Uvicorn) reject GET requests with body content streams or wait for content that never arrives.

## What Changes

- Modify `services/gateway/app/api/routes/stores.py` to check the request method, and set the request body/content to `b""` for GET requests.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
<!-- None -->

## Impact

- Modifies `services/gateway/app/api/routes/stores.py` to correctly handle GET proxy requests.
- Restores functionality for `/api/v1/stores` and `/api/v1/stores/{store_id}/stats` endpoints through the Gateway.
