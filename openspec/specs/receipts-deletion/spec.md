# receipts-deletion Specification

## Purpose
TBD - created by archiving change delete-receipts. Update Purpose after archive.
## Requirements
### Requirement: Delete receipt API endpoint
The backend SHALL expose a `DELETE /cart/receipts/{receipt_id}` endpoint. This endpoint SHALL verify the authenticated user's ID against the receipt owner ID before deleting the record.

#### Scenario: Successfully delete receipt via API
- **WHEN** an authenticated user sends a `DELETE` request for a receipt they own
- **THEN** the system deletes the receipt record and returns a success response

#### Scenario: Prevent unauthorized receipt deletion
- **WHEN** a user attempts to send a `DELETE` request for a receipt owned by another user
- **THEN** the system rejects the request with a 403 Forbidden or 404 Not Found error

### Requirement: Delete receipts button in UI
The `ReceiptsDropdown` and `MyReceiptsModal` SHALL display a delete button next to each receipt item. Clicking this button SHALL invoke the delete mutation, update cache, and remove the item visually.

#### Scenario: Delete receipt in dropdown
- **WHEN** the user clicks the delete trash icon next to a receipt in the dropdown
- **THEN** the receipt is deleted, and the list is re-rendered without that item

### Requirement: Remove AI descriptions from Receipt Page
The `ReceiptPage` SHALL NOT render any AI comments or descriptions. All polling timers, backoff retries, and spinner fallbacks associated with AI descriptions SHALL be removed from the frontend code.

#### Scenario: Render receipt page without AI section
- **WHEN** the user navigates to the receipt details page at `/receipts/:token`
- **THEN** the receipt page loads showing items and totals without attempting to fetch or show an AI description

