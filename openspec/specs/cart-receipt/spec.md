# cart-receipt Specification

## Purpose
TBD - created by archiving change cart-receipt-checkout. Update Purpose after archive.
## Requirements
### Requirement: Complete cart to receipt
The system SHALL allow an authenticated user to finalize an active cart into a frozen receipt (чек) that permanently captures the selected complete store, all item prices, and savings amount at the time of checkout. `POST /carts/{cart_id}/complete` SHALL accept an optional `store_id` query parameter. When `store_id` is omitted, the system SHALL select the complete store with the lowest total price for backward compatibility. The receipt SHALL be immutable after creation — subsequent ETL price updates MUST NOT alter saved receipt data.

#### Scenario: Successful checkout with a selected complete store
- **WHEN** user sends `POST /carts/{cart_id}/complete?store_id=store_b` with a valid `X-User-Id` header
- **WHEN** `store_b` has `is_complete=True` (all items in stock)
- **THEN** system returns HTTP 200 with `ReceiptResponse` containing `id`, `cart_id`, `created_at`, `total_price`, `savings_amount`, `share_token`, `ai_description=null`, and `snapshot` list
- **THEN** `snapshot[0]` contains `store_b` and its item prices
- **THEN** `ai_description` field is `null` in the immediate response (AI generation is asynchronous)

#### Scenario: Checkout without an explicit store
- **WHEN** user sends `POST /carts/{cart_id}/complete` without `store_id`
- **WHEN** at least one store has `is_complete=True`
- **THEN** `snapshot[0]` contains the complete store with the lowest total price

#### Scenario: Checkout with an incomplete selected store
- **WHEN** user sends `POST /carts/{cart_id}/complete` with a `store_id` whose comparison has `is_complete=False`
- **THEN** system returns HTTP 422 explaining that the selected store does not have all cart items
- **THEN** the cart remains active and no receipt is created

#### Scenario: Checkout with no fully-complete store
- **WHEN** user sends `POST /carts/{cart_id}/complete`
- **WHEN** no store has `is_complete=True`
- **THEN** system returns HTTP 422 explaining that no store has all cart items
- **THEN** the cart remains active and no receipt is created

#### Scenario: Checkout of empty cart
- **WHEN** user sends `POST /carts/{cart_id}/complete` for a cart with no items
- **THEN** system returns HTTP 422 with detail explaining cart is empty

#### Scenario: Checkout of another user's cart
- **WHEN** user sends `POST /carts/{cart_id}/complete` for a cart belonging to a different user
- **THEN** system returns HTTP 404

### Requirement: Savings amount calculation
The system SHALL calculate `savings_amount` as the highest `total_price` among all stores with `is_complete=True` minus the selected complete store's `total_price`. If only one `is_complete=True` store exists, `savings_amount` SHALL be `0.00`. Partially-complete stores MUST NOT be included in this calculation.

#### Scenario: Multiple complete stores
- **WHEN** stores A (127.20 ₴, complete), B (150.60 ₴, complete), C (140.00 ₴, complete) exist
- **WHEN** store C is selected
- **THEN** `savings_amount` = 150.60 − 140.00 = 10.60

#### Scenario: Single complete store
- **WHEN** only one store has `is_complete=True`
- **THEN** `savings_amount` = 0.00

### Requirement: Store-consistent cart prices
Each store returned by `GET /carts/{cart_id}/compare` SHALL include an `item_prices` list with `product_id`, `unit_price`, `quantity`, and `subtotal` for every available cart item. A client that selects a complete store SHALL display these unit prices and subtotals so that the sum of visible cart rows equals the selected store's `total_price`.

#### Scenario: User selects a store with different item prices
- **WHEN** the cart initially displays global minimum prices for its products
- **WHEN** the user selects a complete store from the comparison
- **THEN** every cart row displays the corresponding `item_prices.unit_price` from that store
- **THEN** each row total equals `unit_price × quantity`
- **THEN** the sum of row totals equals the selected store's `total_price`

#### Scenario: Duplicate latest offers for one physical store
- **WHEN** Product Service returns duplicate latest offers for the same product and `store_id`
- **THEN** the comparison includes that product only once for that store
- **THEN** the duplicate MUST NOT inflate `found_items_count`, `item_prices`, or `total_price`

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
