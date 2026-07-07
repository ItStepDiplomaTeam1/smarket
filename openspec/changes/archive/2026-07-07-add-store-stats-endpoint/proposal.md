## Why

The store card in the user interface displays store-specific metrics: total products, active promo items, and the maximum discount percentage (e.g. "до 24%"). Currently, the backend lacks an endpoint to fetch these aggregated statistics, and calculating them client-side is infeasible due to pagination limits. Adding a dedicated statistics endpoint resolves this gap.

## What Changes

- Add a new `GET /api/v1/stores/{store_id}/stats` endpoint in `product_service` to calculate and return the total number of items, promo items, and the maximum discount percentage for a store using a high-performance database query.
- Add `StoreStatsResponse` Pydantic schema to handle the serialization of these metrics.
- Leverages the existing wildcard route proxy in the API Gateway (`gateway_service`) to expose this new endpoint to the frontend without any gateway-level modifications.

## Capabilities

### New Capabilities
- `store-statistics`: Computes and retrieves active catalog stats (total products in stock, promotional product count, and max discount percentage) for a given store.

### Modified Capabilities
<!-- None -->

## Impact

- `services/product_service/app/routers/stores.py` (new API endpoint).
- `services/product_service/app/shared/schemas.py` (new response model schema).
