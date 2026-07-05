## 1. Gateway Proxy Cookie Isolation

- [x] 1.1 Create a dedicated `httpx.AsyncClient` instance for auth proxying in `services/gateway/app/main.py` lifespan, initialized without cookie accumulation (e.g., custom transport that strips `Set-Cookie` from responses, or a `httpx.AsyncClient` with `cookies` disabled)
- [x] 1.2 Update `services/gateway/app/api/routes/auth.py` `proxy_request()` to use the dedicated auth-proxy client instead of the shared `request.app.state.http_client`
- [x] 1.3 Verify that the shared `httpx.AsyncClient` used for other routes (cart, products, etc.) is unaffected

## 2. Auth Service Cookie Hardening

- [x] 2.1 Add `path="/"` to `response.set_cookie()` in `services/auth_service/routers/auth.py` — register endpoint (line ~147)
- [x] 2.2 Add `path="/"` to `response.set_cookie()` in `services/auth_service/routers/auth.py` — login endpoint (line ~222)
- [x] 2.3 Add `path="/"` to `response.set_cookie()` in `services/auth_service/routers/auth.py` — refresh endpoint (line ~328)
- [x] 2.4 Add `path="/"` to `response.delete_cookie()` in `services/auth_service/routers/auth.py` — logout endpoint (line ~404)
- [x] 2.5 Add `path="/"` to `response.set_cookie()` in `services/auth_service/routers/oauth.py` — Google OAuth endpoint

## 3. Refresh Token Rotation Revocation

- [x] 3.1 In `services/auth_service/routers/auth.py` `/refresh` endpoint, after validating the old refresh token and before issuing new tokens, blacklist the old token's `jti` using `blacklist_token(jti, ttl)` where ttl is the remaining lifetime of the old token
- [x] 3.2 Verify that the existing `is_token_blacklisted()` check (already present in `/refresh`) correctly rejects blacklisted tokens after rotation

## 4. Frontend Server-Side Logout

- [x] 4.1 In `apps/react/frontend/my-react-app/src/shared/ui/Header/Header.tsx` `handleLogout()`, call `apiClient.post('/api/v1/auth/logout')` before calling `logout()` from Zustand, then navigate. Handle errors gracefully (clear local state regardless).
- [x] 4.2 In `apps/react/frontend/my-react-app/src/modules/Profile/components/Sidebar.tsx` `handleLogout()`, apply the same server-side logout call pattern.

## 5. Frontend Stale Token Cleanup

- [x] 5.1 In `apps/react/frontend/my-react-app/src/modules/Auth/store/authStore.ts`, add a `version` and `migrate` function to the Zustand persist config that checks if the persisted token is expired on rehydration. If expired, return the initial state instead of the persisted state.
- [x] 5.2 Alternatively, add a check in `apps/react/frontend/my-react-app/src/app/main.tsx` (or a top-level auth provider) that runs once on mount: if `isAuthenticated` is true but the token is expired, call `logout()` immediately.
