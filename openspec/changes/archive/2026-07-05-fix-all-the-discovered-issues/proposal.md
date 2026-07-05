## Why

Users intermittently get "kicked out" — they log in, browse for ~15 minutes, then the site silently logs them out and they must re-authenticate. Investigation revealed multiple auth bugs: the gateway's shared httpx client leaks cookies between users, the frontend never calls the server-side logout endpoint (leaving zombie refresh tokens alive for 7 days), refresh tokens are not revoked on rotation, and missing `path=/` on cookies creates fragile path-scoping behavior.

## What Changes

- **Gateway proxy**: Stop httpx from accumulating `Set-Cookie` headers across requests by disabling cookie jar on the shared `httpx.AsyncClient` (or not forwarding accumulated cookies).
- **Frontend logout**: Call `POST /api/v1/auth/logout` before clearing local state, so the server blacklists the refresh token and deletes the cookie.
- **Refresh token rotation**: Blacklist the old refresh token's `jti` when issuing a new one on `/refresh`, making refresh tokens single-use.
- **Cookie hardening**: Add explicit `path=/` to all `set_cookie()` and `delete_cookie()` calls in auth_service.
- **Frontend rehydration**: Clear stale access tokens on page reload instead of blindly rehydrating from localStorage.

## Capabilities

### New Capabilities
- `auth-token-security`: Fixes to the JWT refresh-token lifecycle — rotation revocation, cookie path, logout blacklisting.
- `gateway-proxy-isolation`: Ensures the gateway's shared httpx client does not leak cookies between different users' requests.
- `frontend-auth-resilience`: Improves frontend auth state management — server-side logout, stale token cleanup on reload.

### Modified Capabilities

## Impact

- **Backend**: `services/auth_service/routers/auth.py` (cookie path, refresh revocation), `services/gateway/app/main.py` or `services/gateway/app/api/routes/auth.py` (httpx client cookie isolation).
- **Frontend**: `apps/react/frontend/my-react-app/src/shared/api/apiClient.ts` (logout call, rehydration), `apps/react/frontend/my-react-app/src/shared/ui/Header/Header.tsx`, `apps/react/frontend/my-react-app/src/modules/Profile/components/Sidebar.tsx` (logout calls).
- **Security**: Refresh tokens become single-use; logout is effective immediately; no cross-user cookie leakage.
- **Breaking changes**: None — all changes are backward-compatible.
