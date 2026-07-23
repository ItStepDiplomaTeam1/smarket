# cart-receipt Specification

## MODIFIED Requirements

### Requirement: Complete cart to receipt
The system SHALL allow an authenticated user to finalize an active cart into a frozen receipt (чек) that permanently captures the best available store, all item prices, and savings amount at the time of checkout. The receipt SHALL be immutable after creation — subsequent ETL price updates MUST NOT alter saved receipt data. The public shared-cart response MUST NOT contain the cart owner's `user_id` or internal `cart_id`.

#### Scenario: Successful checkout with a complete store
- **WHEN** user sends `POST /carts/{cart_id}/complete` with a valid `X-User-Id` header
- **WHEN** at least one store has `is_complete=True` (all items in stock)
- **THEN** system returns HTTP 200 with `ReceiptResponse` containing `id`, `created_at`, `total_price`, `savings_amount`, `share_token`, `ai_description=null`, and `snapshot` list
- **THEN** `snapshot[0]` contains the `is_complete=True` store with the lowest total price
- **THEN** `ai_description` field is `null` in the immediate response (AI generation is asynchronous)
- **THEN** response MUST NOT disclose `user_id` or `cart_id`

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
