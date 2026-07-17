## 1. CSS Animation Setup

- [x] 1.1 Add View Transitions API CSS configuration and keyframes (fade-out, fade-in-slide-up) to `src/index.css`
- [x] 1.2 Add CSS class `.animate-page-enter` with animation definitions to `src/index.css`

## 2. Layout and Router Integration

- [x] 2.1 Import `useLocation` and wrap `<Outlet />` inside `src/app/layouts/MainLayout.tsx` in a key-bound transition div
- [x] 2.2 Add `viewTransition` prop to NavLinks in `src/shared/ui/Header/Header.tsx`
- [x] 2.3 Add `viewTransition` prop to Links in product modules (`SMProduct.tsx`, `MainContent.tsx`) and auth components (`Login.tsx`, `Create.tsx`)

## 3. Shimmer Skeleton Components

- [x] 3.1 Create reusable `CatalogSkeleton`, `ShopsSkeleton`, and generic `PageSkeleton` components
- [x] 3.2 Update `src/app/routes/Router.tsx` to replace raw text `<Suspense>` fallbacks with visual skeleton loaders
