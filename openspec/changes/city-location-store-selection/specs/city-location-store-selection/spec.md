## ADDED Requirements

### Requirement: Global City Selection and Local Storage
The client application SHALL maintain a global city selection state in `locationStore` (Zustand), persisted in `localStorage` under `smarket_user_city`. Default city SHALL be "Київ" if no selection exists.

#### Scenario: Default city initialization
- **WHEN** a new user opens the application for the first time
- **THEN** the selected city defaults to "Київ" in local storage and application state

#### Scenario: User changes selected city
- **WHEN** the user selects a new city (e.g. "Львів") from the city selector modal
- **THEN** `locationStore` updates the selected city, persists it to `localStorage`, and triggers re-fetching of location-dependent data (stores, products)

### Requirement: Available Cities API Endpoint
The `product_service` SHALL provide an endpoint `GET /api/v1/stores/cities` returning a list of all distinct cities with active stores and the store count for each city.

#### Scenario: Fetch available cities
- **WHEN** the client sends a `GET /api/v1/stores/cities` request
- **THEN** the system returns a HTTP 200 JSON list containing object elements with `city` (string) and `count` (integer) for all active stores

### Requirement: Location-based Store Filtering
The `product_service` SHALL filter stores by `city` when requested via `GET /api/v1/stores/?city=<city_name>` using case-insensitive matching.

#### Scenario: Filter stores by city
- **WHEN** the client queries `GET /api/v1/stores/?city=Львів&is_active=true`
- **THEN** the system returns only active stores located in "Львів"

### Requirement: Location-aware Product Search Filtering
The `search_service` (Meilisearch) and `product_service` SHALL support filtering search results and product listings by the user's selected `city`.

#### Scenario: Search products in selected city
- **WHEN** a user searches for products with `city` query parameter set to "Одеса"
- **THEN** the search engine returns products and price offers available in stores operating within "Одеса"
