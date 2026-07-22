## 1. Gateway Proxy Route Fixes

- [x] 1.1 Update `services/gateway/app/api/routes/favorites.py` to set `body_content = b""` for GET/DELETE requests instead of streaming empty request body.
- [x] 1.2 Update `services/gateway/app/api/routes/cart.py` to sanitize request stream body for GET/DELETE operations.
- [x] 1.3 Audit and update `services/gateway/app/api/routes/search.py` and `agent.py` proxy body handlers for GET requests.

## 2. Frontend React Optimization

- [x] 2.1 Refactor `SMProduct.tsx` in `apps/react/frontend/my-react-app/src/modules/Product/components/SMProduct.tsx` to reuse product item objects directly from category listing endpoint without initiating N+1 `apiClient.get('/api/v1/products/${id}')` requests.
- [x] 2.2 Add retry mechanism or graceful error states to `ProductDetail.tsx` and `SMProduct.tsx` to prevent blank white error screens on temporary network glitches.
- [x] 2.3 Ensure `favoritesStore.ts` non-blocking UI behavior and graceful timeout handling.

## 3. Product Service Database Query Optimization

- [x] 3.1 Optimize SQL query execution for `get_product` in `services/product_service/app/routers/products.py` so price aggregation subquery executes efficiently without full table scanning.

## 4. Verification

- [x] 4.1 Test Gateway endpoints `/api/v1/products/{id}` and `/api/v1/favorites/` with GET and DELETE methods to ensure clean response without timeout.
- [x] 4.2 Run frontend dev server / build to verify `ProductDetail` and `SMProduct` render quickly without triggering Axios 10000ms timeout errors.
