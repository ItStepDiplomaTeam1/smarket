## Why

Currently, the user's completed receipts/shopping lists are only accessible via a centered overlay modal (`MyReceiptsModal`) on the cart page. This makes it difficult for users to access, share, or verify their completed shopping receipts quickly when navigating other parts of the application (e.g., Home page, Catalog page, or Shops). Adding a receipts dropdown inside the header next to the favorites icon will make completed lists easily accessible from any page on the Smarket platform.

## What Changes

- Add a new "Receipts" (file-text or calendar/receipt icon) button to the desktop/tablet header, located next to the Favorites (heart) icon.
- Implement a dropdown popover component (`ReceiptsDropdown`) that opens when the receipts icon is clicked, mirroring the visual layout, smooth scaling transitions, and outside-click close behavior of the existing Favorites dropdown.
- Render a list of the user's most recent receipts inside the dropdown with summary details (store name, purchase date, total price, and summary of top items).
- Provide navigation from each receipt card in the dropdown directly to the respective receipt page `/receipts/:token`.
- Add an empty state inside the dropdown for users with no completed receipts.

## Capabilities

### New Capabilities
- `receipts-dropdown`: Outlines the requirements, visual specs, interaction rules, and mock states for the dropdown receipts list in the main header.

### Modified Capabilities

## Impact

- **Affected Code**: `apps/react/frontend/my-react-app/src/shared/ui/Header/Header.tsx` (adds toggle button and dropdown overlay logic).
- **New Components**: A new component or inner layout inside the header for rendering active/archived receipts.
- **Dependencies**: Utilizes the existing `useGetMyReceipts` and `useGetReceipt` TanStack Query hooks.
