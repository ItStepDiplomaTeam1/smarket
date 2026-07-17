## 1. Gateway — Popular Products Fetch Logic

- [x] 1.1 In `services/gateway/app/api/routes/admin.py`, define the `MOCK_RATINGS` constant list with 5 tuples: `(4.8, 412)`, `(4.6, 287)`, `(4.9, 193)`, `(4.3, 156)`, `(4.7, 98)`.
- [x] 1.2 Add async helper function `fetch_popular_products(client)` that calls `GET {PRODUCT_SERVICE_URL}/api/v1/products?limit=5&in_stock=true` with a 5-second timeout, maps results by index to `MOCK_RATINGS`, and returns a list of `{id, name, category, image, rating, reviews}` dicts. Return `[]` on any exception.
- [x] 1.3 Add `fetch_popular_products(client)` to the `asyncio.gather(...)` call in `get_dashboard_summary` alongside the existing `fetch_product_stats`, `fetch_auth_stats`, and `fetch_system_logs` coroutines.
- [x] 1.4 Pass the result of `fetch_popular_products` into the `"popularProducts"` field of the `JSONResponse` returned by `get_dashboard_summary`.

## 2. Verification

- [x] 2.1 Confirm the `GET /admin/dashboard-summary` endpoint returns a non-empty `popularProducts` array with 5 items when `product_service` is running and has in-stock products.
- [x] 2.2 Confirm each item in `popularProducts` has the fields: `id`, `name`, `category`, `image`, `rating`, `reviews`.
- [x] 2.3 Confirm the admin dashboard UI `PopularProductsWidget` now shows real product names and images instead of frontend mock placeholders.
- [x] 2.4 Confirm that if `product_service` is down, `dashboard-summary` still returns 200 with `popularProducts: []` and no server error.
