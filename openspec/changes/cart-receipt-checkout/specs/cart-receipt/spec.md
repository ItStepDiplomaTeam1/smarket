## ADDED Requirements

### Requirement: Complete cart to receipt
The system SHALL allow an authenticated user to finalize an active cart into a frozen receipt (чек) that permanently captures the best available store, all item prices, and savings amount at the time of checkout. The receipt SHALL be immutable after creation — subsequent ETL price updates MUST NOT alter saved receipt data.

#### Scenario: Successful checkout with a complete store
- **WHEN** user sends `POST /carts/{cart_id}/complete` with a valid `X-User-Id` header
- **WHEN** at least one store has `is_complete=True` (all items in stock)
- **THEN** system returns HTTP 200 with `ReceiptResponse` containing `id`, `cart_id`, `created_at`, `total_price`, `savings_amount`, `share_token`, `ai_description=null`, and `snapshot` list
- **THEN** `snapshot[0]` contains the `is_complete=True` store with the lowest total price
- **THEN** `ai_description` field is `null` in the immediate response (AI generation is asynchronous)

#### Scenario: Checkout with no fully-complete store
- **WHEN** user sends `POST /carts/{cart_id}/complete`
- **WHEN** no store has `is_complete=True`
- **THEN** system selects the store with the fewest missing items (lowest `missing_items_count`)
- **THEN** `snapshot` records include which items are absent (`in_stock=false`) — items MUST NOT be hidden or omitted

#### Scenario: Checkout of empty cart
- **WHEN** user sends `POST /carts/{cart_id}/complete` for a cart with no items
- **THEN** system returns HTTP 422 with detail explaining cart is empty

#### Scenario: Checkout of another user's cart
- **WHEN** user sends `POST /carts/{cart_id}/complete` for a cart belonging to a different user
- **THEN** system returns HTTP 404

### Requirement: Savings amount calculation
The system SHALL calculate `savings_amount` as the difference between the selected store's `total_price` and the highest `total_price` among all stores that are also `is_complete=True`. If only one `is_complete=True` store exists, `savings_amount` SHALL be `0.00`. If no `is_complete=True` store exists, `savings_amount` SHALL be calculated relative to the most expensive partially-complete store and MUST NOT be artificially inflated.

#### Scenario: Multiple complete stores
- **WHEN** stores A (127.20 ₴, complete), B (150.60 ₴, complete), C (140.00 ₴, complete) exist
- **WHEN** store A is selected (lowest price)
- **THEN** `savings_amount` = 150.60 − 127.20 = 23.40

#### Scenario: Single complete store
- **WHEN** only one store has `is_complete=True`
- **THEN** `savings_amount` = 0.00

### Requirement: Receipt immutability
The system SHALL store receipt data in a dedicated `receipts` table as a JSONB snapshot. The receipt MUST NOT reference live `prices` table records. Prices captured in `snapshot` MUST remain unchanged for the lifetime of the receipt record.

#### Scenario: ETL update after receipt creation
- **WHEN** ETL updates prices after a receipt is created
- **THEN** `GET /receipts/{share_token}` still returns the original prices from the snapshot
- **THEN** the receipt's `total_price` and `savings_amount` remain unchanged

### Requirement: Asynchronous AI description generation
The system SHALL respond to `POST /carts/{cart_id}/complete` immediately without waiting for AI text generation. After the response is sent, a background task SHALL call `POST /agent/summarize-plan`. Upon success, the system SHALL update `receipts.ai_description`. If the AI call fails or times out, `ai_description` SHALL remain `null` permanently — no retries, no re-generation on subsequent views.

#### Scenario: AI generation succeeds
- **WHEN** receipt is created
- **WHEN** background task calls `/agent/summarize-plan` and succeeds
- **THEN** `receipts.ai_description` is updated with the generated text
- **THEN** subsequent `GET /receipts/{share_token}` returns `ai_description` with content

#### Scenario: AI generation fails
- **WHEN** background task calls `/agent/summarize-plan` and receives 503 or timeout
- **THEN** `receipts.ai_description` remains `null`
- **THEN** no retry is scheduled
- **THEN** subsequent `GET /receipts/{share_token}` returns `ai_description: null`

### Requirement: Receipt share token
The system SHALL generate a unique `share_token` (URL-safe, 22 characters from `secrets.token_urlsafe(16)`) for each receipt at creation time. The token SHALL be stored with a UNIQUE index in the `receipts` table.

#### Scenario: Token uniqueness collision (extremely rare)
- **WHEN** generated token already exists in the database
- **THEN** system regenerates a new token before saving
