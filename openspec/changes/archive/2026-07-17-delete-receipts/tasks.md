## 1. Backend Endpoint Implementation

- [x] 1.1 Add the `DELETE /cart/receipts/{receipt_id}` route inside `services/cart_service/app/routers/receipts.py`

## 2. API Hooks Setup

- [x] 2.1 Implement the `useDeleteReceipt` mutation inside `apps/react/frontend/my-react-app/src/hooks/api/useCartApi.ts`

## 3. UI Receipt Deletion Wiring

- [x] 3.1 Add the trash delete icon button to `ReceiptsDropdown.tsx` next to each list row
- [x] 3.2 Add the trash delete button to `MyReceiptsModal.tsx` next to each list item card
- [x] 3.3 Bind click events with `e.stopPropagation()` and a browser prompt confirmation to prevent navigations on delete

## 4. UI AI Descriptions Cleanup

- [x] 4.1 Remove the AI comment section, AI note title, and spinner skeletons from `ReceiptPage.tsx`
- [x] 4.2 Remove retry limits, backoff arrays, timeout states, and hooks from `ReceiptPage.tsx`
