## ADDED Requirements

### Requirement: Public receipt page accessible without authentication
The system SHALL expose a public endpoint `GET /receipts/{share_token}` that returns the full receipt data for a valid share token. This endpoint MUST NOT require an `Authorization` header or `X-User-Id` header.

#### Scenario: Valid share token access
- **WHEN** any client (authenticated or not) sends `GET /receipts/{share_token}`
- **WHEN** the token matches an existing receipt
- **THEN** system returns HTTP 200 with `ReceiptPublicResponse` containing full snapshot, `created_at`, `total_price`, `savings_amount`, `ai_description` (or null)

#### Scenario: Invalid or expired share token
- **WHEN** client sends `GET /receipts/{share_token}` with a non-existent token
- **THEN** system returns HTTP 404

### Requirement: Receipt page frontend route
The frontend SHALL provide a route `/receipts/:token` that renders the receipt page for any visitor, authenticated or not. This route MUST be accessible without login.

#### Scenario: Direct link navigation
- **WHEN** user opens `/receipts/abc123xyz` in a browser without being logged in
- **THEN** the receipt page loads and displays the full receipt

#### Scenario: AI description loading strategy
- **WHEN** receipt page loads and `ai_description` is `null`
- **THEN** frontend shows a skeleton placeholder for the AI note block
- **THEN** frontend performs exactly one retry `GET` after 3-4 seconds
- **WHEN** retry also returns `ai_description: null`
- **THEN** the AI note block is silently removed from the layout (no error message shown)

#### Scenario: Google Maps route link
- **WHEN** receipt snapshot contains `lat` and `lng` for the selected store
- **THEN** "Прокласти маршрут" link renders as `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
- **WHEN** snapshot has multiple stores with coordinates
- **THEN** link includes `&waypoints={lat1},{lng1}|...` for intermediate stops and `destination` for the last store

### Requirement: Share receipt via share button
The receipt page SHALL provide a "Поділитися" button that shares the receipt URL using `navigator.share()` with clipboard fallback when the Web Share API is unavailable.

#### Scenario: Web Share API available
- **WHEN** user clicks "Поділитися" on the receipt page
- **WHEN** `navigator.share` is supported
- **THEN** system invokes `navigator.share({ url: window.location.href })`

#### Scenario: Web Share API not available
- **WHEN** user clicks "Поділитися"
- **WHEN** `navigator.share` is not supported
- **THEN** receipt URL is copied to clipboard
