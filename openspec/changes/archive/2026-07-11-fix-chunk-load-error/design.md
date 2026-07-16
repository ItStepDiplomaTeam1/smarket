## Context

When a new version of the frontend is built and deployed, the files on the server change, including their hashes (e.g. `CartPage-DHHLf4Tn.js` becomes `CartPage-newHash.js`). Active users browsing the application with the old version still loaded will encounter a dynamic import failure (network 404) when trying to navigate to a page that was not yet cached. Without custom error boundary settings in React Router, the screen crashes with an unhandled default error UI.

## Goals / Non-Goals

**Goals:**
- Automatically reload the browser on chunk load failures to fetch the latest application bundle.
- Prevent infinite reload loops in case the server is offline or the file is permanently missing.
- Implement a premium, brand-aligned Ukrainian Error Boundary UI as a fallback for other runtime crashes.
- Clear retry flags from storage on successful mount.

**Non-Goals:**
- Caching all lazy pages offline via Service Workers.
- Retrying standard API or HTTP requests that fail due to backend downtime.

## Decisions

- **Decision 1: Use `lazyWithRetry` wrapper for lazy components**
  - **Rationale**: Wrapping components using a custom `lazyWithRetry` interceptor allows us to handle the chunk load failure before it bubbles up to the router. This provides the most seamless recovery (automatic background reload).
  - **Alternatives Considered**: 
    - *Global window error listener*: Catching errors at the window level is less targeted and can trigger reloads for unrelated script errors.
    - *Direct handling in Error Boundary*: Handled at the Error Boundary level, but then the user sees a brief flash of the error screen before reloading, which is not as smooth.

- **Decision 2: Use `sessionStorage` for reload state tracking**
  - **Rationale**: `sessionStorage` is scoped to the current tab and session, which is ideal. It persists across a page reload, allowing us to detect if a reload already occurred and avoid an infinite loop if the chunk is genuinely missing.
  - **Alternatives Considered**:
    - *localStorage*: Persists permanently, which could block future recovery attempts if not cleaned up properly.
    - *State/Ref variables*: Lost on page reload, so they cannot be used to prevent infinite reload loops.

- **Decision 3: Global Route Error Boundary on Root Route**
  - **Rationale**: Adding `errorElement` to the root route `path: '/'` catches all errors in children components (like `MainLayout` or page views). Since it's a full-screen layout, it ensures that a broken Header/Footer doesn't render alongside the error.
  - **Alternatives Considered**:
    - *Local boundaries*: Harder to maintain and might still leave layout elements broken.

## Risks / Trade-offs

- **[Risk]**: The user might experience a brief page refresh when navigating to a newly updated page.
  - **Mitigation**: This only happens once after a redeployment, and it is much better than a broken app experience.
- **[Risk]**: Slow network could cause chunk fetch timeouts and trigger a reload.
  - **Mitigation**: The retry will occur once, and if the network is still slow/offline, the Error Boundary will display a friendly message instead of looping.
