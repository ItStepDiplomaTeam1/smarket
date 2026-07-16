## ADDED Requirements

### Requirement: Gateway fetches first 5 in-stock products for popular products widget
The `GET /admin/dashboard-summary` endpoint in `gateway_service` SHALL fetch the first 5 in-stock products from `product_service` and return them as the `popularProducts` field, with hardcoded mock ratings and review counts assigned by product index position.

#### Scenario: product_service returns products successfully
- **WHEN** the admin dashboard summary is requested
- **THEN** the gateway SHALL call `GET /api/v1/products?limit=5&in_stock=true` on `product_service`
- **THEN** the response SHALL include a `popularProducts` array with up to 5 items, each containing `id`, `name`, `category`, `image`, `rating`, and `reviews` fields

#### Scenario: product_service returns fewer than 5 products
- **WHEN** `product_service` returns fewer than 5 in-stock products
- **THEN** the gateway SHALL return only the products that were available, with mock ratings assigned by index

#### Scenario: product_service call fails or times out
- **WHEN** the call to `product_service` raises an exception or returns a non-200 status
- **THEN** the gateway SHALL return `popularProducts: []` without failing the entire dashboard summary request

#### Scenario: Mock ratings are assigned by index
- **WHEN** products are returned from `product_service`
- **THEN** each product at index `i` SHALL receive the `rating` and `reviews` values from the `MOCK_RATINGS` list at position `i`
- **THEN** the five mock rating pairs SHALL be `(4.8, 412)`, `(4.6, 287)`, `(4.9, 193)`, `(4.3, 156)`, `(4.7, 98)` in order

#### Scenario: Product image field mapping
- **WHEN** a product from `product_service` has a non-null `image_url`
- **THEN** the gateway SHALL map it to the `image` field in the `popularProducts` response
- **WHEN** `image_url` is null or missing
- **THEN** the gateway SHALL use an empty string `""` as the `image` value
