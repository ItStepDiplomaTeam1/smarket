# receipt-list Specification

## Purpose
TBD - created by archiving change cart-receipt-checkout. Update Purpose after archive.
## Requirements
### Requirement: List user receipts
The system SHALL provide an authenticated endpoint `GET /receipts` that returns a paginated list of receipts belonging to the current user, ordered by `created_at` descending. Each item in the list SHALL contain: `id`, `share_token`, `created_at`, `total_price`, `savings_amount`, and `store_name` (derived from `snapshot[0].store_name`).

#### Scenario: User with receipts
- **WHEN** authenticated user sends `GET /receipts` with valid `X-User-Id`
- **WHEN** user has 3 receipts
- **THEN** system returns HTTP 200 with array of 3 `ReceiptListItem` objects
- **THEN** items are ordered newest first

#### Scenario: User with no receipts
- **WHEN** authenticated user sends `GET /receipts`
- **WHEN** user has no receipts
- **THEN** system returns HTTP 200 with empty array `[]`

### Requirement: My receipts modal
The frontend SHALL provide a modal "Мої чеки" accessible from the main UI, displaying the user's receipt list. Each receipt card SHALL show: date (`created_at`), store name, savings amount. Clicking a card SHALL navigate to `/receipts/{share_token}` — NOT open receipt detail inside the modal.

#### Scenario: Empty receipt list
- **WHEN** user opens "Мої чеки" modal
- **WHEN** user has no receipts
- **THEN** modal displays an empty state message (e.g., "Ви ще не завершували жодного кошика")

#### Scenario: Receipt card navigation
- **WHEN** user clicks on a receipt card in the modal
- **THEN** browser navigates to `/receipts/{share_token}` for that receipt
- **THEN** modal closes

#### Scenario: Modal style matches existing modals
- **WHEN** modal opens
- **THEN** overlay and card styling MUST match the pattern used in `CreateCartModal.tsx` and `ReviewModal.tsx`

