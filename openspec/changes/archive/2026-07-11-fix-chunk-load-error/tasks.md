## 1. Core Utilities and Components

- [x] 1.1 Create `lazyWithRetry.ts` utility at `apps/react/frontend/my-react-app/src/shared/utils/lazyWithRetry.ts`
- [x] 1.2 Create `RootErrorBoundary.tsx` component at `apps/react/frontend/my-react-app/src/shared/components/ErrorBoundary/RootErrorBoundary.tsx`

## 2. Routing Integration

- [x] 2.1 Import `RootErrorBoundary` and `lazyWithRetry` in `apps/react/frontend/my-react-app/src/app/routes/Router.tsx`
- [x] 2.2 Update `Router.tsx` to set `errorElement: <RootErrorBoundary />` on the root route
- [x] 2.3 Convert standard `lazy` page imports in `Router.tsx` to use `lazyWithRetry`
- [x] 2.4 Also apply `lazyWithRetry` and `errorElement` changes to the alternate route file `index.tsx` for consistency

## 3. Lifecycle Integration and Cleanup

- [x] 3.1 Clear chunk loading sessionStorage flags on successful application mount in `apps/react/frontend/my-react-app/src/app/main.tsx`

## 4. Verification

- [x] 4.1 Build the React application locally to verify no TypeScript or bundle errors
