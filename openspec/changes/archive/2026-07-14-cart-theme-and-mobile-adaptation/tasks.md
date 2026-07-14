## 1. Page Layout & General Container Adaptation

- [x] 1.1 Add dark mode background class `dark:bg-[#0B110F]` to the main wrapper in `CartPage.tsx`.
- [x] 1.2 Update the breadcrumb text colors to use `dark:text-[#A9B6B0]` and active text to `dark:text-white`.
- [x] 1.3 Update the main header and description text to use `dark:text-white` and `dark:text-[#A9B6B0]`.
- [x] 1.4 Make buttons in `CartPage.tsx` adaptive (e.g. "Перейти в каталог" should use dark styles, "Створити новий кошик" should use `dark:bg-[#3DAE8B] dark:text-[#111A17]`).
- [x] 1.5 Make the loading spinner use `dark:border-[#3DAE8B]`.

## 2. Modifying CartSavedList

- [x] 2.1 Update the wrapper of `CartSavedList.tsx` with `dark:bg-[#111A17]`, `dark:border-[#265447]/30`, and text `dark:text-white`.
- [x] 2.2 Make cart items in the sidebar lists list highlight properly in dark mode using `dark:bg-[#265447]/40` and hover classes.
- [x] 2.3 Add collapsible drawer/accordion configuration on mobile (viewport < 1024px) for the saved lists sidebar.

## 3. Modifying CartDetails & Quantity Selectors

- [x] 3.1 Update `CartDetails.tsx` container wrapper to support `dark:bg-[#111A17]` and `dark:border-[#265447]/30`.
- [x] 3.2 Style individual cart items inside `CartDetails` with surface background `dark:bg-[#1D2A25]`, border `dark:border-[#265447]/20`, and title text `dark:text-white`.
- [x] 3.3 Ensure retailer name and price tags have high contrast in dark mode (using `dark:text-[#3DAE8B]`).
- [x] 3.4 Increase interactive touch target dimensions for quantity controls (increment, decrement, remove) to a minimum of 44x44px.
- [x] 3.5 Make the items list responsive: wrap item layouts, adjust image sizing, and format content structure vertically on mobile.

## 4. Modifying CartSummary & State Components

- [x] 4.1 Update `CartSummary.tsx` container with `dark:bg-[#111A17]`, `dark:border-[#265447]/30`, and text colors.
- [x] 4.2 Update checkout primary button in `CartSummary.tsx` to use Smarket brand dark styling.
- [x] 4.3 Style `CartEmptyState.tsx` and `CartUnauthState.tsx` to support dark background, secondary text colors, and high contrast buttons.

## 5. CreateCartModal Adaptive Layout

- [x] 5.1 Adapt `CreateCartModal.tsx` overlay backdrop and modal box container (`dark:bg-[#111A17]`, `dark:border-[#265447]/30`).
- [x] 5.2 Style input fields inside `CreateCartModal.tsx` (`dark:bg-[#1D2A25]`, `dark:text-[#EAF7F2]`, `dark:border-[#265447]`).
- [x] 5.3 Implement mobile bottom sheet layout styling for `CreateCartModal` on viewports < 640px.

## 6. Verification & Checking

- [x] 6.1 Check that the build completes successfully without TypeScript errors.
- [x] 6.2 Validate dark theme colors and accessibility contrast ratios using the browser dev tools in local preview.
- [x] 6.3 Verify mobile responsiveness at different viewport widths (320px, 375px, 768px, 1024px) using responsive emulation.
