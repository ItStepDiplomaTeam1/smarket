## Context

Currently, users can only access their historical shopping receipts inside a modal on the Cart page (`/cart`), which is inconvenient. To make receipts accessible from anywhere on the platform, we want to implement a header dropdown similar to the Favorites dropdown.

## Goals / Non-Goals

**Goals:**
- Implement a dropdown button and popup popover in the main `Header` component.
- Display a list of the user's recent receipts with summaries (date, store, items, total, and savings).
- Navigate to the detailed `/receipts/:token` page when a receipt is clicked.
- Align design styles, borders, typography, hover states, and animations with the existing Favorites dropdown in `Header.tsx`.

**Non-Goals:**
- Changing database schemas, API Gateway routing, or creating new backend endpoints (we reuse existing endpoints via `/api/v1/cart/receipts`).
- Modifying the full-screen centered dialog on `/cart` page (it will continue to exist as-is).

## Decisions

### 1. New Sibling Component: `ReceiptsDropdown.tsx`
- **Choice**: Create a new file `apps/react/frontend/my-react-app/src/shared/ui/Header/ReceiptsDropdown.tsx` rather than placing all logic inside `Header.tsx`.
- **Rationale**: Keeps `Header.tsx` cleaner and more maintainable. The dropdown can be imported and mounted next to the favorites icon.

### 2. Data Fetching and Cache Reuse
- **Choice**: Use the existing `useGetMyReceipts` and parallel `useQueries` hooks to fetch each receipt's details.
- **Rationale**: By using the same query keys as the `/cart` modal and `/receipts/:token` page, TanStack Query will automatically share the query cache. Opening the dropdown will pre-fetch details, making navigation to the full receipt page instantaneous.
- **Optimization**: The query will only be enabled when the dropdown is open (`enabled: isOpen`) to save resources, and the dropdown list will be capped at the 5 most recent receipts.

### 3. Icon Selection
- **Choice**: Use `ReceiptText` or `FileText` from `lucide-react` for the toggle button.
- **Rationale**: Fits the visual semantics of receipts and aligns cleanly with the Lucide `Heart` icon used for favorites.

## Risks / Trade-offs

- **[Risk] High request concurrency on open**: Open dropdown launches 1 query for the list, plus up to 5 queries in parallel for individual receipt details.
  - *Mitigation*: Cap the list size in the dropdown to `5` items (instead of 10) and define a `staleTime: 60000` (1 minute) for details queries to minimize repeat network requests.
