## Why

The admin dashboard needs to display a list of "Popular Products" based on product ratings. However, the rating calculation currently happens on the frontend and the `reviews_service` lacks an endpoint to aggregate and return the top-rated products. To quickly deliver a functional prototype for the dashboard without immediately building the backend aggregation logic, we will mock the popular products directly in the API Gateway.

## What Changes

- Modify the `/admin/dashboard-summary` endpoint in the `gateway` service.
- Fetch the first 5 in-stock products from the `product_service`.
- Assign hardcoded realistic ratings and review counts to these fetched products.
- Return these products as the `popularProducts` array in the dashboard summary response.

## Capabilities

### New Capabilities
- `dashboard-mock-popular-products`: Temporary mocking of popular products data with hardcoded ratings and review counts at the API Gateway level to unblock dashboard UI development.

### Modified Capabilities
- None

## Impact

- `services/gateway/app/api/routes/admin.py`: The `get_dashboard_summary` function will be updated to make a new HTTP call to `product_service` and process the results.
- No changes to `product_service` or `reviews_service`.
- The frontend will naturally start displaying these real products (with mock ratings) instead of the hardcoded frontend mocks.
