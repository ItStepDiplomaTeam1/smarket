## ADDED Requirements

### Requirement: Gateway auth proxy shall not accumulate cookies
The gateway's proxy for auth routes SHALL NOT accumulate or leak `Set-Cookie` headers between different user requests. Each proxied request to auth_service SHALL use a cookie jar that is scoped to that individual request, not shared across requests.

#### Scenario: Two concurrent logins do not share cookies
- **WHEN** User A logs in via the gateway, and User B logs in via the gateway concurrently
- **THEN** User A receives User A's refresh_token cookie, and User B receives User B's refresh_token cookie, with no cross-contamination

#### Scenario: Refresh request uses only the browser's cookie
- **WHEN** the gateway proxies a `POST /api/v1/auth/refresh` request from the browser
- **THEN** the forwarded request to auth_service contains only the `Cookie` header from the original browser request, with no additional cookies accumulated from previous requests

### Requirement: Gateway proxies Set-Cookie headers correctly
The gateway's `StreamingResponse` proxy SHALL forward all `Set-Cookie` headers from auth_service responses to the browser without modification or loss.

#### Scenario: Login response forwards Set-Cookie
- **WHEN** auth_service responds to a login request with `Set-Cookie: refresh_token=...`
- **THEN** the browser receives the exact same `Set-Cookie` header through the gateway proxy
