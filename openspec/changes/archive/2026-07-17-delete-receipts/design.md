## Context

Currently, the system provides no way to delete receipts. The `ReceiptPage.tsx` also displays an AI description box which uses backoff polling timers on load to fetch background-generated summaries. We want to implement a deletion endpoint, wire it to the frontend dropdown and modal, and remove the AI descriptions completely.

## Goals / Non-Goals

**Goals:**
- Add `DELETE /cart/receipts/{receipt_id}` on the `cart_service` microservice.
- Add `useDeleteReceipt` mutation to TanStack Query hooks.
- Mount delete buttons on `ReceiptsDropdown.tsx` and `MyReceiptsModal.tsx`.
- Completely remove the AI description comment block, backoff query states, and timers from `ReceiptPage.tsx`.

**Non-Goals:**
- Removing or modifying the database column `ai_description` from PostgreSQL tables. We keep the database schema as-is to preserve compatibility with other services (like the AI assistant chatbot).
- Deleting receipts from anonymous sessions (deletions are only authorized for authenticated owners).

## Decisions

### 1. Backend Deletion Route
- **Choice**: Implement `DELETE /cart/receipts/{receipt_id}` in `cart_service` using standard SQLAlchemy session deletes.
- **Rationale**: Since the API Gateway catches all endpoints under `/api/v1/cart/*` and proxies them, adding this route in the cart microservice instantly makes it public under `/api/v1/cart/receipts/{receipt_id}`.

### 2. Mutation Hook & Cache Invalidation
- **Choice**: Define `useDeleteReceipt` using `useMutation`.
- **Rationale**: Re-uses the query client to invalidate `['my-receipts']` upon successful deletion. This automatically triggers re-fetches for `ReceiptsDropdown` and `MyReceiptsModal`.

### 3. Cleanup of `ReceiptPage.tsx`
- **Choice**: Delete the entire AI comment UI block, as well as the exponential retry logic (`MAX_RETRIES`, `BACKOFF_DELAYS`, `timerRef`, `scheduleRetry`, and the corresponding `useEffect` hook).
- **Rationale**: Simplifying the page avoids needless background queries and keeps the client load minimal.

## Risks / Trade-offs

- **[Risk] Accidental clicks**: Users may delete a receipt by mistake.
  - *Mitigation*: Trigger a browser confirmation `window.confirm("Ви впевнені, що хочете видалити цей чек?")` before invoking the delete mutation.
- **[Risk] Event bubbling**: Clicking the delete button inside a list card might trigger a redirect to the receipt details page.
  - *Mitigation*: Invoke `e.stopPropagation()` inside the delete button click handler.
