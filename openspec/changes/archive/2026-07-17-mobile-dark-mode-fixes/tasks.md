## 1. Cookie Theme Persistence & Switcher Fixes

- [x] 1.1 Add cookie helpers to `src/shared/store/useThemeStore.ts` to set a cookie named `theme` when theme changes. Correct all relative imports to absolute `@/` imports.
- [x] 1.2 Update `src/app/providers/ThemeProvider.tsx` to read the initial theme preference from the `theme` cookie and fix relative imports.
- [x] 1.3 Fix relative imports in `src/shared/ui/ThemeToggle/ThemeToggle.tsx`.

## 2. Product Detail Page Mobile & Dark Theme Adaptations

- [x] 2.1 Update `src/pages/ProductDetail/ui/ProductDetail.tsx` to use dark theme colors for loading and not-found states.
- [x] 2.2 Refactor layout in `src/modules/Product/components/ProductHero.tsx` using responsive flex classes and apply `dark:` styles to backgrounds, texts, inputs, and comparison tables.
- [x] 2.3 Refactor layout in `src/modules/Product/components/About.tsx` to use responsive grids and apply `dark:` backgrounds/borders.
- [x] 2.4 Refactor layout in `src/modules/Product/components/Reviews.tsx` to support vertical stacking of comments on mobile and add `dark:` theme colors.
- [x] 2.5 Refactor `src/modules/Product/components/FBT.tsx` and `src/modules/Product/components/SMProduct.tsx` for responsive scaling and dark theme.

## 3. User Profile Page Mobile & Dark Theme Adaptations

- [x] 3.1 Update layout of `src/pages/Profile/ui/ProfilePage.tsx` to support stacking on mobile and dark background.
- [x] 3.2 Update `src/modules/Profile/components/Sidebar.tsx` to allow full-width sizing on mobile and add `dark:` styles.
- [x] 3.3 Update `src/modules/Profile/components/MainContent.tsx` to make lists/tables responsive on mobile viewports and apply dark theme colors.
- [x] 3.4 Update other profile content files (e.g. `SettingsContent.tsx`, `ReviewsContent.tsx`, `FavoritesContent.tsx`, `BasketsContent.tsx`) to support dark theme text and backgrounds.

## 4. Modal Dropdowns Mobile Adaptations

- [x] 4.1 Update `src/modules/Cart/components/MyReceiptsModal.tsx` to ensure layout fits correctly and scrolls on mobile viewports.
- [x] 4.2 Update `src/shared/ui/Header/ReceiptsDropdown.tsx` to adjust overlay positioning and scaling on small screens.

## 5. Backend Receipt and Cart Deletion Cleanup

- [x] 5.1 Modify `services/cart_service/app/routers/receipts.py` to delete the associated `Cart` when `delete_user_receipt` is called.
- [x] 5.2 Modify `services/cart_service/app/routers/cart.py` to delete the completed `Cart` when `complete_cart` is called.
- [x] 5.3 Update `useCompleteCart` and `useDeleteReceipt` hooks in `src/hooks/api/useCartApi.ts` to invalidate the `['carts']` query key.
