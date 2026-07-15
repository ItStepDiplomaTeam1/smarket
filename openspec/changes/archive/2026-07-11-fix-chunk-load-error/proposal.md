## Why

When the application is redeployed, browser clients with active sessions hold references to old JS chunk filenames (e.g., `CartPage-DHHLf4Tn.js`). When navigating, the browser tries to fetch the old chunk and receives a 404 from the server, causing a dynamic import error. Because React Router does not have custom error boundaries configured, it displays an unhandled crash page with technical details, which degrades user experience.

## What Changes

- Add a global `RootErrorBoundary` component to act as the `errorElement` for the application router.
- Implement `lazyWithRetry` to wrap dynamic imports, automatically detecting chunk load failures and reloading the page to fetch the latest application bundle.
- Integrate the `RootErrorBoundary` in `Router.tsx` on the root route.
- Clear retry flags from `sessionStorage` upon successful application mounting.

## Capabilities

### New Capabilities
- `error-boundary-recovery`: Handles client-side route rendering errors and dynamic import/chunk loading failures with automatic page refreshing and custom, brand-aligned fallback interfaces.

### Modified Capabilities
- `frontend-routing`: Modify router definition to include error boundaries at the root layout.

## Impact

- **Affected code**: `Router.tsx`, `index.tsx`, `main.tsx`.
- **Dependencies**: Uses `lucide-react` for icons and standard React Router hooks.
