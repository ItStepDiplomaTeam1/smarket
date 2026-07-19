## Context

When a user is on the Smarket frontend, their session state (Zustand store `useAuthStore`) is persisted in `auth-storage` localStorage. If their session expires or is terminated on the backend:
1. The frontend still has `isAuthenticated: true` in localStorage.
2. The user profile header displays the username (e.g., "Timothy") and active avatar.
3. If they navigate directly to `/auth`, the page does not redirect them, displaying the login form alongside the authenticated header.

## Goals / Non-Goals

**Goals:**
- Validate the session immediately on application mount by invoking `/api/v1/auth/me` globally.
- Automatically clear the localStorage session if session validation fails due to authentication errors (401/403).
- Redirect authenticated users away from `/auth` to the home page `/`.

**Non-Goals:**
- Handling custom session expiration banners/notifications in this change.

## Decisions

### Decision 1: Call `useFetchMe()` globally in MainLayout.tsx
- **Option A (Chosen):** Invoke `useFetchMe()` directly in `MainLayout.tsx`.
  * *Rationale:* `MainLayout` is the root layout rendered for all pages, so it mounts immediately on application startup. Calling `useFetchMe` there forces the query to run, which in turn invokes `apiClient`. If the token is expired, the request interceptor will automatically trigger token refresh or clear the store (logout) if refresh fails.
- **Option B:** Validate token programmatically on route change.
  * *Rationale:* More complex, duplicate code. Using `useQuery` via `useFetchMe` fits perfectly into the existing TanStack Query lifecycle.

### Decision 2: Guard the `/auth` page in `AuthPage/index.tsx`
- **Option A (Chosen):** Check `isAuthenticated` and redirect to `/` using `useNavigate` inside `useEffect` in `AuthPage`.
  * *Rationale:* Simple, responsive, works perfectly with the reactive store state.

## Risks / Trade-offs

- **Risk:** Infinite redirect loop if `isAuthenticated` remains true but backend calls fail.
  * *Mitigation:* Ensure `logout()` is definitely called if the session validation fails. Adding a `useEffect` inside `useFetchMe` to catch query error statuses (401/403) and call `logout()` guarantees state cleanup.
