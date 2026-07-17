## Why

Currently, users cannot delete completed receipts, leading to list clutter. Additionally, the AI descriptions shown on the receipt page require multiple background query retries and clutter the receipt layout. Removing the AI descriptions and providing a delete function will streamline receipt history management.

## What Changes

- **API Endpoint**: Introduce a new `DELETE /cart/receipts/{receipt_id}` endpoint in `cart_service` to allow users to delete their receipts.
- **API Hook**: Add a `useDeleteReceipt` mutation hook inside `apps/react/frontend/my-react-app/src/hooks/api/useCartApi.ts`.
- **UI Modifications**:
  - Add a delete icon button next to receipt items inside the `ReceiptsDropdown` component.
  - Add a delete button inside the centered receipts list modal (`MyReceiptsModal.tsx`).
  - Update `ReceiptPage.tsx` to remove the AI description comment block completely.
  - Remove retry, state backoff, and timer logic related to AI descriptions inside `ReceiptPage.tsx`.

## Capabilities

### New Capabilities
- `receipts-deletion`: Defines requirements for deleting completed receipts and removing AI descriptions from the UI.

### Modified Capabilities

## Impact

- **Backend (cart_service)**: Add the `DELETE` endpoint in `app/routers/receipts.py`.
- **Frontend (my-react-app)**:
  - Add `useDeleteReceipt` mutation hook in `useCartApi.ts`.
  - Update `ReceiptsDropdown.tsx`, `MyReceiptsModal.tsx`, and `ReceiptPage.tsx`.
