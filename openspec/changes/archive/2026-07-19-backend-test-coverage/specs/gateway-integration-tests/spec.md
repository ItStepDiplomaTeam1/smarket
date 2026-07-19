## ADDED Requirements

### Requirement: JWT verification for protected routes
The `gateway` SHALL verify access JWTs for all protected routes before proxying. A valid token MUST have `type == "access"` and be signed with `JWT_SECRET_KEY` using `JWT_ALGORITHM`.

#### Scenario: Valid access token passes through
- **WHEN** a request to a protected route includes a valid `Authorization: Bearer <access-token>` header
- **THEN** the gateway MUST extract the payload, inject `X-User-Id` and `X-User-Role` headers, and forward the request to the downstream service

#### Scenario: Expired token is rejected
- **WHEN** a request includes a JWT whose signature is valid but expired
- **THEN** the gateway MUST respond with HTTP 401 and MUST NOT forward the request

#### Scenario: Malformed token is rejected
- **WHEN** the `Authorization` header is missing, not a bearer token, or contains an unparseable JWT
- **THEN** the gateway MUST respond with HTTP 401 and MUST NOT forward the request

### Requirement: Public routes bypass JWT
The `gateway` SHALL allow unauthenticated access to register, login, refresh, public product GET, search, and stores endpoints.

#### Scenario: Public product listing without token
- **WHEN** GET `/api/v1/products` is requested without an `Authorization` header
- **THEN** the gateway MUST forward the request to the product service without requiring a JWT

### Requirement: Admin role enforcement
The `gateway` SHALL enforce that all `/api/v1/admin/*` routes are reachable only when the verified JWT's payload role is either `admin` or `superadmin`.

#### Scenario: Admin user can access admin routes
- **WHEN** a request to `/api/v1/admin/*` includes a valid JWT whose `role` claim is `admin` or `superadmin`
- **THEN** the gateway MUST forward the request to the downstream admin endpoint

#### Scenario: Regular user is forbidden from admin routes
- **WHEN** a request to `/api/v1/admin/*` includes a valid JWT whose `role` claim is `user`
- **THEN** the gateway MUST respond with HTTP 403 and MUST NOT forward the request

### Requirement: Proxy error handling
The `gateway` SHALL translate downstream service unavailability into a structured HTTP error rather than crashing.

#### Scenario: Downstream service unreachable
- **WHEN** the gateway attempts to proxy a request and the downstream service raises `httpx.ConnectError`
- **THEN** the gateway MUST respond with HTTP 503 (Service Unavailable) and MUST NOT propagate the raw exception to the client
