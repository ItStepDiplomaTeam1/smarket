## ADDED Requirements

### Requirement: Non-blocking Favorites Proxy Execution
The API Gateway SHALL proxy favorite requests (`GET`, `POST`, `DELETE` to `/api/v1/favorites/`) to `cart_service` without hanging or timing out.

#### Scenario: Adding Item to Favorites
- **WHEN** an authenticated user clicks the "Add to Favorites" button
- **THEN** the request SHALL be proxied cleanly to cart_service and respond within <1000ms

#### Scenario: Fetching User Favorites List
- **WHEN** the frontend requests GET `/api/v1/favorites/`
- **THEN** the API Gateway SHALL NOT pass a streaming body, returning the favorites list promptly
