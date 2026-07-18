## ADDED Requirements

### Requirement: Product listing with filters
The `product_service` SHALL expose GET `/api/v1/products` supporting filters by store list, category, subcategories, discount offers, max price, free-text search, and sortable columns.

#### Scenario: Filter by store list
- **WHEN** GET `/api/v1/products?stores=silpo,novus` is requested
- **THEN** the response MUST only include products whose `store_id` matches one of the listed chains

#### Scenario: Filter by category and max price
- **WHEN** GET `/api/v1/products?category=molochni-produkty&max_price=50` is requested
- **THEN** the response MUST only include products in the matching category whose cheapest active price is <= 50 UAH

#### Scenario: Sort by price ascending
- **WHEN** GET `/api/v1/products?sort=price_asc` is requested
- **THEN** the response MUST be ordered by current price ascending

### Requirement: Product detail with live prices
The `product_service` SHALL expose GET `/api/v1/products/{product_id}` returning the product's metadata together with all current active prices across stores, ranked cheapest first.

#### Scenario: Known product returns prices
- **WHEN** GET `/api/v1/products/{known_id}` is requested for an existing product
- **THEN** the response MUST include the product's title, brand, image_url, and a `prices` array with at least one entry; the prices MUST be ordered by price ascending

#### Scenario: Unknown product id returns 404
- **WHEN** GET `/api/v1/products/{unknown_id}` is requested
- **THEN** the service MUST respond with HTTP 404 and MUST NOT leak internal exception details in the body

### Requirement: Pagination consistency
The `product_service` SHALL return paginated responses with consistent `total`, `page`, `page_size`, and `items` fields across all list endpoints.

#### Scenario: First page request
- **WHEN** GET `/api/v1/products?page=1&page_size=20` is requested
- **THEN** the response MUST include `total` (total matching items), `page=1`, `page_size=20`, and an `items` array with at most 20 entries

#### Scenario: Page beyond result set
- **WHEN** GET `/api/v1/products?page=9999` is requested for a result set of fewer than `page_size * 9998` items
- **THEN** the response MUST return an empty `items` array and a correct `total` reflecting the actual number of matching items
