## Context

The Smarket auth system uses JWT access tokens (15 min) stored in Zustand/localStorage and refresh tokens (7 days) stored in httpOnly cookies. The gateway proxies all auth requests between the browser and auth_service using a shared `httpx.AsyncClient`. Investigation revealed multiple bugs that collectively cause users to be intermittently "kicked out" — they log in, browse for ~15 minutes, then silently lose their session.

Current architecture:
- Browser → Gateway (`:8080`) → auth_service (`:8001`) for login/refresh/logout
- Gateway uses `StreamingResponse` to proxy raw responses including `Set-Cookie` headers
- Frontend stores access_token in Zustand persist (localStorage), refresh_token in browser cookie jar
- Frontend interceptors handle proactive + reactive token refresh on 401

## Goals / Non-Goals

**Goals:**
- Fix the cross-user cookie leakage in the gateway proxy
- Make logout effective immediately (blacklist refresh token + delete cookie)
- Make refresh tokens single-use (blacklist old `jti` on rotation)
- Add explicit `path=/` to all auth cookies
- Clean up stale tokens on page reload instead of trusting localStorage blindly

**Non-Goals:**
- Moving refresh tokens from cookies to headers (current architecture is fine)
- Implementing token rotation with database storage (Redis blacklist is sufficient)
- Changing the access token from 15-minute to a different TTL
- Adding CSRF tokens (SameSite=Lax + httpOnly is sufficient for this architecture)
- Refactoring the frontend auth store (Zustand persist is fine, just needs cleanup)

## Decisions

### 1. Disable httpx cookie jar on the gateway's shared client

**Decision:** Create the `httpx.AsyncClient` with a custom transport or configure it so it does NOT automatically store `Set-Cookie` headers from responses. The simplest approach: pass `cookies=None` and override the response handling, OR create a new client per-request (too expensive), OR use `httpx.Client(trust_env=False)` — actually the cleanest fix is to **not use `client.send()` with streaming for auth routes** and instead use a **per-request client** or **disable cookie tracking**.

**Chosen approach:** Create the `httpx.AsyncClient` with a wrapper that strips cookies from responses before httpx can store them. Alternatively, the simplest and most robust fix: **create a separate httpx.AsyncClient for auth proxy that does not accumulate cookies** — but since the client is shared, the better approach is to **extract and forward only the `Cookie` header from the incoming request explicitly**, rather than relying on httpx's behavior. The proxy_request function already copies `request.headers` which includes the browser's `Cookie` header. The problem is httpx's `send()` may also inject its own stored cookies.

**Final approach:** After each proxied auth request, clear the httpx client's cookie jar for the auth_service domain. Or better: set `client.cookies.clear()` after each proxy call. Simplest: **don't let httpx accumulate cookies** by resetting the jar periodically or per-request.

**Actually the simplest fix:** In `proxy_request`, before calling `client.send()`, temporarily clear the client's cookies for the auth_service domain, and restore after. Or: use a dedicated cookieless client for auth proxying.

**Simplest robust fix:** Create a separate `httpx.AsyncClient` instance specifically for auth proxy that is initialized without cookie handling. Use this dedicated client in `proxy_request` for auth routes only.

### 2. Frontend calls server-side logout

**Decision:** Before clearing Zustand state, the frontend SHALL call `POST /api/v1/auth/logout` via `apiClient` (which sends the refresh_token cookie via `withCredentials: true`). Only after the server confirms (or on network error) should local state be cleared.

**Rationale:** This ensures the refresh token's `jti` is blacklisted in Redis and the cookie is deleted server-side. Without this, stolen refresh tokens remain valid for 7 days.

### 3. Blacklist old refresh token on rotation

**Decision:** In the `/refresh` endpoint, after successfully validating the old refresh token, blacklist its `jti` in Redis before issuing new tokens. This makes refresh tokens single-use.

**Rationale:** Standard security practice. Prevents stolen refresh tokens from being reused after the legitimate user refreshes.

### 4. Add `path=/` to all cookies

**Decision:** Add `path="/"` explicitly to every `response.set_cookie()` and `response.delete_cookie()` call in `auth.py` and `oauth.py`.

**Rationale:** Eliminates reliance on framework default path calculation, which could break if request URIs change.

### 5. Clean stale tokens on frontend reload

**Decision:** On Zustand rehydration from localStorage, validate the persisted access token's expiry. If expired, immediately clear the store instead of showing a flash of authenticated state.

**Rationale:** Prevents the "flash of logged-in then kicked out" UX issue on page reload.

## Risks / Trade-offs

- **Separate httpx client for auth proxy** → Adds one more connection pool (minor memory increase). Mitigated by using small pool limits.
- **Single-use refresh tokens** → If a user has multiple tabs open, only the first tab to refresh wins; others get 401 and must re-login. This is acceptable and is standard behavior.
- **Frontend logout call** → If the server is down during logout, the local state is still cleared. The cookie remains valid until it expires naturally. This is an acceptable degradation.
- **Stale token cleanup on reload** → User with an expired token sees a brief unauthenticated state before the page fully loads. This is the correct behavior (better than showing authenticated then kicking out).
