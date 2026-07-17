## 1. Expose Error State from useGetMyReceipts

- [x] 1.1 Update `useGetMyReceipts` hook in `useCartApi.ts` to destructure and return `error` and `isError` from React Query
- [x] 1.2 Update `MyReceiptsModal.tsx` to accept `error` and `isError` from the hook

## 2. Add Error State UI to MyReceiptsModal

- [x] 2.1 Add error state rendering in `MyReceiptsModal.tsx` between loading and empty states
- [x] 2.2 Display Ukrainian error messages based on error type (401, 500, network)
- [x] 2.3 Add retry button that refetches the receipt list

## 3. Fix AI Description Retry Logic

- [x] 3.1 Update `ReceiptPage.tsx` to use exponential backoff polling (3s → 6s → 12s) instead of single 4-second retry
- [x] 3.2 Track retry count with state and stop after 3 attempts
- [x] 3.3 Keep skeleton loading visible during all retry attempts

## 4. Verify and Test

- [x] 4.1 Test receipt modal shows error on API failure
- [x] 4.2 Test receipt modal shows empty state only on success with no data
- [x] 4.3 Test AI description appears after background task completes
- [x] 4.4 Test AI description section hides after max retries if still null
