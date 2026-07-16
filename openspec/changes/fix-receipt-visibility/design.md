## Context

The receipt system has two visibility problems:

1. **Error masking**: `MyReceiptsModal` treats API errors as "no receipts" because `useGetMyReceipts` doesn't expose error state. When JWT expires, server returns 500, or network fails, users see "You haven't completed any cart yet" — a misleading empty state.

2. **AI description race**: `ReceiptPage` retries once at 4 seconds for `ai_description`, but the background task calls Zephyros agent with a 10-second timeout. If AI takes 5-10 seconds, the single retry fetches before the description is saved, and no further retries occur.

Current flow:
```
User clicks "Мої чеки"
  → MyReceiptsModal opens
  → useGetMyReceipts fires GET /api/v1/cart/receipts
  → If API fails: data = undefined, modal shows "no receipts" (BUG)
  → If API succeeds: receipts list renders correctly
```

## Goals / Non-Goals

**Goals:**
- Users see their receipts when they exist
- Users see meaningful error messages when API fails
- AI description reliably appears after receipt creation
- Minimal changes — fix the bugs, don't redesign the receipt system

**Non-Goals:**
- Redesigning receipt data model
- Adding receipt deletion/editing
- Changing receipt sharing mechanism
- Optimizing receipt list performance

## Decisions

### Decision 1: Expose error state from useGetMyReceipts

**Choice**: Destructure `error` and `isError` from React Query and pass to modal.

**Alternative considered**: Add `enabled` guard to prevent firing when not authenticated.
- Rejected because CartPage already gates behind `isAuthenticated`. Adding redundant checks adds complexity without fixing the core issue (error masking).

**Rationale**: React Query already tracks error state. We just need to surface it.

### Decision 2: Three-state rendering in MyReceiptsModal

**Choice**: Replace binary `isLoading / empty` with `isLoading / error / empty / list`.

```
Current:  isLoading → empty → list
Proposed: isLoading → error → empty → list
```

**Rationale**: Clear separation of concerns. Each state has distinct UI.

### Decision 3: Exponential backoff for AI description retry

**Choice**: Poll with exponential backoff: 3s → 6s → 12s → stop (max 3 retries).

**Alternative considered**: Increase single retry to 10 seconds.
- Rejected because it adds 10 seconds of latency for users who already have the description. Backoff starts fast (3s) for common case, extends only when needed.

**Rationale**: Background AI task typically completes in 3-8 seconds. Starting at 3s catches most cases quickly. Extending to 12s covers edge cases without infinite polling.

### Decision 4: Show loading skeleton during AI description polling

**Choice**: Keep skeleton visible during all retry attempts, hide only when description appears or retries exhausted.

**Rationale**: Users see continuous loading state instead of flashing between skeleton and empty.

## Risks / Trade-offs

- **[Risk]** Exponential backoff could delay description display if AI is slow → **Mitigation**: Max 3 retries (18s total), then show receipt without description. User can refresh page.
- **[Risk]** Error messages might expose internal details → **Mitigation**: Show generic messages ("Помилка завантаження чеків") not raw error text.
- **[Risk]** Polling adds network requests → **Mitigation**: Max 3 requests over 18 seconds is negligible.
