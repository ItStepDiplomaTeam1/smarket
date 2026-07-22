## Why

Users experience `AxiosError: timeout of 10000ms exceeded` when loading product detail pages, fetching similar products, or clicking the "Add to Favorites" button. This happens because Gateway routes forward `request.stream()` for GET/DELETE requests (causing downstream ASGI services to hang waiting for a body), `SMProduct.tsx` executes N+1 parallel HTTP requests per product detail page, and `product_service` queries on the `prices` table suffer from database connection pool bottlenecks under concurrent load.

## What Changes

- **API Gateway Request Proxying**: Fix `services/gateway/app/api/routes/` (`favorites.py`, `cart.py`, `search.py`, `agent.py`) to pass empty body `b""` instead of `request.stream()` for `GET`, `DELETE`, and `HEAD` requests.
- **Frontend Optimization (`SMProduct.tsx`)**: Replace 4 parallel `apiClient.get('/api/v1/products/${p.id}')` calls with batch fetching or reusing product data from category listing.
- **Backend Query Performance (`product_service`)**: Optimize `get_product` query in `services/product_service/app/routers/products.py` to prevent full table scans on `prices` log table during `max(recorded_at)` subqueries.
- **Frontend Resilience (`apiClient.ts` & `favoritesStore`)**: Add explicit error handling, request deduplication/caching, and prevent infinite loops during token refresh interceptors.

## Capabilities

### Modified Capabilities
- `product-catalog`: Optimize product detail and similar products API response latency and payload fetching.
- `user-favorites`: Ensure favorite toggle operations complete cleanly without request timeouts or Gateway hanging.

## Impact

- `services/gateway`: Modifies HTTP request body forwarding logic across proxy routers.
- `services/product_service`: Optimizes SQL queries for product detail retrieval.
- `services/cart_service`: Responds reliably to `/favorites` proxy requests.
- `apps/react`: Modifies `SMProduct.tsx`, `apiClient.ts`, and `favoritesStore.ts` for optimized network calls.
