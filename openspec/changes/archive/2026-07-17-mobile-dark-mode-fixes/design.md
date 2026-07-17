## Context

1. **Mobile Layouts & Dark Theme on Pages**:
   - The Product Detail page (`/product/:id`) and User Profile page (`/profile`) currently lack responsive styling for mobile screen sizes (width < 768px). Both pages use hardcoded spacing, fixed container widths (e.g. `w-[453px]`, `w-[623px]`), and do not apply Tailwind `dark:` color variants.
   - Modal dropdowns (e.g., in `MyReceiptsModal`, `ReceiptsDropdown`, and select-elements inside widgets) overflow the viewport width or look cut-off on mobile devices.
2. **Persistent Theme State**:
   - The theme toggle switcher switcher updates the global Zustand store (`useThemeStore.ts`) but does not persist the selection in a cookie. For server-side rendering or persistence across multiple page reloads, a `theme` cookie should be set.
3. **Receipt Deletion completeness**:
   - Completed carts currently remain in the active carts list. Deleting a receipt does not delete the associated cart or trigger refetching of the active carts list. To make deletion complete, completing a cart should delete the active cart, and deleting a receipt should remove the receipt and ensure any residual associated cart is deleted, invalidating both `['my-receipts']` and `['carts']` query caches.

## Goals / Non-Goals

**Goals:**
- Implement Mobile-First responsive layouts for Product Details and Profile page.
- Apply high-contrast dark theme colors via `dark:` class modifiers.
- Adapt dropdown selectors in modals to fit mobile screens.
- Store the user's theme selection in a cookie named `theme`.
- Delete the completed cart from the database upon cart completion, and delete the associated cart (if any exists) when a receipt is deleted.
- Invalidate the active carts query list when a receipt is deleted or completed.

**Non-Goals:**
- Introducing external packages for cookie management (implemented using native `document.cookie`).
- Redesigning the core cart or receipt data schema.

## Decisions

### Decision 1: Mobile-Responsive Layout Refactoring
- **Choice**: Use CSS grid/flex and responsive prefixes (`sm:`, `md:`, `lg:`) instead of hardcoded pixel dimensions on main content containers on the Product Details page and User Profile page.
- **Rationale**: Stacking the left and right panels vertically on smaller viewports prevents clipping and scrollbars.

### Decision 2: Dark Theme Application
- **Choice**: Utilize CSS variables already defined in `index.css` via Tailwind v4 utility classes (e.g., `bg-admin-bg`, `bg-admin-surface`, `text-admin-text-bold`, `text-admin-text-regular`) and apply `dark:` prefix modifiers to page elements.
- **Rationale**: Overriding hardcoded hex codes like `bg-[#F6FAF8]` or `bg-white` with theme colors ensures proper dark mode support.

### Decision 3: Cookie-Based Theme Persistence
- **Choice**: Add helper functions to read and write cookies in `useThemeStore.ts` and set a cookie named `theme` when `setTheme` is called. Update `ThemeProvider.tsx` to read the initial theme preference from the cookie.
- **Rationale**: Cookies persist the state across reloads and allow potential SSR compatibility without layout flashing.

### Decision 4: Receipt Deletion and Cart Cleanup
- **Choice**:
  1. In the backend `complete_cart` endpoint (`services/cart_service/app/routers/cart.py`), delete the `Cart` after creating the `Receipt` within the same transaction.
  2. In the backend `delete_user_receipt` endpoint (`services/cart_service/app/routers/receipts.py`), look up and delete the associated `Cart` if its ID matches the receipt's `cart_id`.
  3. On the frontend, query invalidation in `useCompleteCart` and `useDeleteReceipt` will invalidate both `['my-receipts']` and `['carts']` caches.
- **Rationale**: Ensures that completed carts do not clutter the active carts list, and receipt deletion cleanly sweeps away all related data.

## Risks / Trade-offs

- **[Risk]** Deleting completed carts removes active cart data. → **Mitigation**: This is the expected behavior, as the completed cart has been snapshot into a receipt. The user can easily duplicate a receipt or import a receipt back to a cart if they want to reuse it.
