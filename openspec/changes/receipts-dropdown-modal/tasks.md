## 1. Setup & Sub-component Creation

- [x] 1.1 Create the `ReceiptsDropdown.tsx` component file in `apps/react/frontend/my-react-app/src/shared/ui/Header/`
- [x] 1.2 Import required icons (`X`, `Calendar`, `AlertCircle`, `ReceiptText`) and custom API hooks (`useGetMyReceipts`, `useQueries`, `apiClient`) in `ReceiptsDropdown.tsx`

## 2. Data Queries & List Formatting

- [x] 2.1 Implement the main receipts query using `useGetMyReceipts` triggered only when `isOpen` is active
- [x] 2.2 Configure `useQueries` to retrieve detail snapshots for the top 5 receipts in parallel with `staleTime` optimization
- [x] 2.3 Write date and currency localization formatters matching `ReceiptPage` logic

## 3. UI Rendering & Styles Alignment

- [x] 3.1 Build the dropdown container overlay, mimicking the visual classes, dark theme variables, borders, and animations of the Favorites dropdown
- [x] 3.2 Build the list item rendering displaying the store name, date, price, savings (if any), and previews for the first two items
- [x] 3.3 Add the fallback view for the empty receipts state ("Ви ще не завершували жодного кошика")

## 4. Header Wiring & Event Handlers

- [x] 4.1 Mount the Receipts button and the `ReceiptsDropdown` next to the Favorites dropdown in `Header.tsx`
- [x] 4.2 Add state variables, refs, and outside-click listeners for the Receipts dropdown toggle in `Header.tsx`
- [x] 4.3 Implement event handlers to navigate to `/receipts/:token` and close the dropdown upon item selection
