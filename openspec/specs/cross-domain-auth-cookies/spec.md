# cross-domain-auth-cookies Specification

## Purpose
TBD - created by archiving change fix-jwt-cookie-prod. Update Purpose after archive.
## Requirements
### Requirement: Cross-domain cookie SameSite configuration
The `auth_service` SHALL set the `SameSite` attribute of the `refresh_token` cookie based on the `COOKIE_SAMESITE` environment variable. When `COOKIE_SAMESITE` is not set, it SHALL default to `lax`.

#### Scenario: Production deployment with cross-domain frontend
- **WHEN** `COOKIE_SAMESITE` environment variable is set to `none`
- **THEN** the `refresh_token` cookie MUST be set with `SameSite=None`
- **AND** the `Secure` attribute MUST be `True` (browsers reject `SameSite=None` without `Secure`)
- **AND** the `Partitioned` attribute MUST be present so browsers can persist the cookie in the `pages.dev` top-level site partition

#### Scenario: Local development with same-origin
- **WHEN** `COOKIE_SAMESITE` environment variable is set to `lax` or not set
- **THEN** the `refresh_token` cookie MUST be set with `SameSite=Lax`

### Requirement: Cookie Secure attribute configuration
The `auth_service` SHALL set the `Secure` attribute of the `refresh_token` cookie based on the `COOKIE_SECURE` environment variable. When `COOKIE_SECURE` is not set, it SHALL default to `True` unless `DEBUG=True`.

#### Scenario: Production deployment over HTTPS
- **WHEN** `COOKIE_SECURE` is `true` or not set with `DEBUG=False`
- **THEN** the `refresh_token` cookie MUST have `Secure=True`

#### Scenario: Local development over HTTP
- **WHEN** `COOKIE_SECURE` is `false` or `DEBUG=True`
- **THEN** the `refresh_token` cookie MUST have `Secure=False`

### Requirement: Cookie domain configuration
The `auth_service` SHALL optionally set the `Domain` attribute of the `refresh_token` cookie based on the `COOKIE_DOMAIN` environment variable. When `COOKIE_DOMAIN` is not set, the `Domain` attribute SHALL be omitted from the cookie.

#### Scenario: Domain attribute set in production
- **WHEN** `COOKIE_DOMAIN` is set (e.g., `smarket-api.duckdns.org`)
- **THEN** the `refresh_token` cookie MUST include `Domain=<value>`

#### Scenario: Domain attribute omitted locally
- **WHEN** `COOKIE_DOMAIN` is not set or empty
- **THEN** the `refresh_token` cookie MUST NOT include a `Domain` attribute

### Requirement: Consistent cookie path across all auth endpoints
All endpoints that set the `refresh_token` cookie (`/register`, `/login`, `/refresh`, `/oauth/google`, `/oauth/telegram`) SHALL set `path="/"` on the cookie.

#### Scenario: Register endpoint sets root path
- **WHEN** a user registers via `POST /auth/register`
- **THEN** the `refresh_token` cookie MUST be set with `path="/"`

#### Scenario: All auth endpoints use identical cookie parameters
- **WHEN** any endpoint sets the `refresh_token` cookie
- **THEN** the cookie parameters (`path`, `httponly`, `secure`, `samesite`, `partitioned`, `max_age`, `domain`) MUST be identical across all endpoints

### Requirement: Centralized cookie parameter function
The `auth_service` SHALL provide a single function `_build_cookie_params()` that returns the complete set of cookie parameters. All endpoints setting the `refresh_token` cookie SHALL use this function.

#### Scenario: Adding new cookie parameter
- **WHEN** a new cookie attribute needs to be configured
- **THEN** only the `_build_cookie_params()` function needs to be modified
- **AND** all endpoints automatically use the new attribute

### Requirement: Frontend session persistence across page reloads
The frontend Zustand auth store SHALL NOT clear the authentication state when the access token is expired at rehydration time. Instead, it SHALL preserve the state and rely on the axios request interceptor to silently refresh the token.

#### Scenario: Page reload with expired access token but valid refresh cookie
- **WHEN** a user reloads the page
- **AND** the access token in `localStorage` (via Zustand persist) has expired
- **AND** the `refresh_token` cookie is still valid (within 7-day TTL)
- **THEN** the frontend MUST NOT call `logout()`
- **AND** the first API request MUST trigger the axios interceptor to call `POST /api/v1/auth/refresh`
- **AND** the new access token MUST be stored in Zustand state

#### Scenario: Page reload with both tokens expired
- **WHEN** a user reloads the page
- **AND** the access token has expired
- **AND** the `refresh_token` cookie has also expired or is missing
- **THEN** the axios interceptor's call to `/refresh` SHALL fail with 401
- **AND** the interceptor SHALL call `logout()` to clear the state
- **AND** the user SHALL be treated as unauthenticated

### Requirement: CORS configuration supports production frontend
The API Gateway SHALL include `https://smarket-7go.pages.dev` in the CORS `allow_origins` list and `allow_credentials` MUST be `True`.

#### Scenario: Browser preflight request from production frontend
- **WHEN** the browser sends an `OPTIONS` preflight request from `https://smarket-7go.pages.dev`
- **THEN** the gateway MUST respond with `Access-Control-Allow-Origin: https://smarket-7go.pages.dev`
- **AND** `Access-Control-Allow-Credentials: true`
