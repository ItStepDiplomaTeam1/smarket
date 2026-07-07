## ADDED Requirements

### Requirement: Retrieve Store Statistics
The system SHALL calculate and return store statistics including total items in stock, promo items in stock, and the maximum percentage savings for a given store.

#### Scenario: Retrieve statistics successfully
- **WHEN** client requests `GET /api/v1/stores/{store_id}/stats` for an existing store ID
- **THEN** system returns 200 OK with `total_products` (integer), `promo_products` (integer), and `max_savings` (integer percentage).

#### Scenario: Store not found
- **WHEN** client requests `GET /api/v1/stores/{store_id}/stats` for a non-existent store ID
- **THEN** system returns 404 Not Found error.
