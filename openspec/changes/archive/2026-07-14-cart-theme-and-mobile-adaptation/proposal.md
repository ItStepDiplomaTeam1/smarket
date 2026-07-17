## Why

The Smarket shopping cart page and its internal components currently lack full dark theme styling and mobile responsive adaptation. This causes layout clipping and unreadable contrast ratios on smaller screens or when the user switches the application to dark mode. Adapting the cart page improves user engagement, readability, and the overall checkout funnel.

## What Changes

- Add full dark theme styling (`dark:`) to `CartPage.tsx` and all of its modular subcomponents:
  - `CartDetails.tsx` (cart items list, item quantities, action buttons, and prices)
  - `CartEmptyState.tsx` (empty state illustration and action triggers)
  - `CartSavedList.tsx` (saved shopping lists sidebar)
  - `CartSummary.tsx` (pricing calculation, checkout button, and network details)
  - `CartUnauthState.tsx` (unauthorized user screen and redirect triggers)
  - `CreateCartModal.tsx` (creation input form, modal overlay, and action buttons)
- Implement a mobile-first responsive layout that:
  - Stacks the grid columns vertically on screens smaller than `lg` (1024px) breakpoint.
  - Adjusts header spacing and font sizes dynamically for small viewports.
  - Ensures interactive elements (increment/decrement buttons, delete icons, shop badges) have touch targets of at least 44x44px.
  - Adapts modal windows to slide up from the bottom or fit full screen on mobile devices.

## Capabilities

### New Capabilities
- `cart-theme-adaptation`: Technical requirements for dark theme contrast ratios and mobile-first layout rules on the user's shopping cart page.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

- **Frontend Pages/Components**:
  - `apps/react/frontend/my-react-app/src/pages/Cart/ui/CartPage.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CartDetails.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CartEmptyState.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CartSavedList.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CartSummary.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CartUnauthState.tsx`
  - `apps/react/frontend/my-react-app/src/modules/Cart/components/CreateCartModal.tsx`
