## Why

Currently, when a user's session expires on the backend (or is invalidated), the frontend persists their name and profile (e.g. "Timothy") in localStorage, showing them as logged in in the Header. However, when the user is on the `/auth` page, they are prompted to log in. In addition, there is no route protection redirecting authenticated users away from the `/auth` page. This discrepancy creates a confusing user experience where the user appears to be simultaneously logged in and prompted to log in.

## What Changes

- Fetch the user's profile globally on application load in `MainLayout.tsx` via `useFetchMe()` to validate the session and automatically log the user out if the session is invalid (fails with 401/403).
- Implement a route guard/redirect in `AuthPage` (`pages/Auth/index.tsx`) to navigate logged-in users (`isAuthenticated === true`) to the home page (`/`) automatically.
- Keep the local storage session sync robust.

## Capabilities

### New Capabilities

- `auth-session-sync`: Verification of user session on application mount and routing protection on the authentication page.

### Modified Capabilities

*(None)*

## Impact

- **apps/react** frontend code: Changes in `MainLayout.tsx` and `AuthPage/index.tsx`.
- Immediate cleanup of the header user profile when the session is expired or deleted.
- Proper redirect when authenticated users visit the login/register screen.
