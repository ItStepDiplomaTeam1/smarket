# cart-integration-tests Specification

## Purpose
TBD - created by archiving change backend-test-coverage. Update Purpose after archive.
## Requirements
### Requirement: Add item to cart
The `cart_service` SHALL accept authenticated requests to add a product to a user's cart, persisting a new `cart_items` row linked to the user's default cart.

#### Scenario: Valid add item request
- **WHEN** an authenticated POST `/cart/{cart_id}/items` is sent with a valid `product_id` and `quantity > 0`
- **THEN** the service MUST respond with HTTP 201, persist a new `cart_items` row, and return the created item representation

#### Scenario: Add item to non-owned cart
- **WHEN** an authenticated user attempts to add an item to a `cart_id` belonging to a different user
- **THEN** the service MUST respond with HTTP 404 (or 403) and MUST NOT persist the item

#### Scenario: Add item with invalid payload
- **WHEN** the request body is missing `product_id` or has `quantity <= 0`
- **THEN** the service MUST respond with HTTP 422 and MUST NOT modify the cart

### Requirement: Cart store price comparison
The `cart_service` SHALL compute the total cost of all items in a cart across every active store, returning a ranked summary sorted by total ascending.

#### Scenario: Compare cart across stores with full availability
- **WHEN** GET `/cart/{cart_id}/compare` is called for a cart whose items are available in multiple stores
- **THEN** the response MUST include one entry per store with the total sum, count of found items, and a status flag; the cheapest store MUST be ordered first

#### Scenario: City filter narrows comparison scope
- **WHEN** the compare request includes a city query parameter
- **THEN** the comparison MUST only consider stores physically located in that city, and stores in other cities MUST be excluded

#### Scenario: Empty result fallback when city filter excludes all stores
- **WHEN** a city filter excludes all matching stores
- **THEN** the service MUST fall back to the unfiltered store set (per the existing fallback logic) rather than returning an empty list

### Requirement: Cart checkout creates receipt
The `cart_service` SHALL accept a checkout request that snapshots cart prices and creates a `receipts` row with a unique `share_token`, an `ai_description`, and a price snapshot in `snapshot` JSONB.

#### Scenario: Successful checkout
- **WHEN** POST `/cart/{cart_id}/complete` is called for a non-empty cart
- **THEN** the service MUST create a `receipts` row, return HTTP 201 with the receipt payload (including `total_price` and `share_token`), and trigger an async AI description task

#### Scenario: Checkout of empty cart
- **WHEN** the cart has zero items
- **THEN** the service MUST respond with HTTP 400 (or consistent error) and MUST NOT create a receipt

