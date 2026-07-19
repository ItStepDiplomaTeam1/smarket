## Why

Users who complete a cart and save a receipt cannot see their receipts later. When the receipt list API fails (expired JWT, server error, network timeout), the modal shows "You haven't completed any cart yet" instead of an error message. Additionally, the AI description on receipt pages often never appears because the single retry at 4 seconds races against the background AI generation that can take 10+ seconds.

## What Changes

- **Add error state handling** in `MyReceiptsModal` to distinguish "no receipts" from API failures
- **Expose error state** from `useGetMyReceipts` hook so consumers can render error UI
- **Fix AI description retry logic** in `ReceiptPage` to poll with exponential backoff instead of a single 4-second retry
- **Improve store name fallback** in receipt list endpoint to handle edge cases more gracefully

## Capabilities

### New Capabilities

- `receipt-error-handling`: Proper error state management for receipt listing and display, including API error detection, user-facing error messages, and retry mechanisms

### Modified Capabilities

(none — no existing specs cover receipt display behavior)

## Impact

- **Frontend**: `MyReceiptsModal.tsx`, `ReceiptPage.tsx`, `useCartApi.ts`
- **Backend**: `receipts.py` (minor store name fallback improvement)
- **No breaking changes**: All changes are additive error handling and UX improvements
