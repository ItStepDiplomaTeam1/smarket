## ADDED Requirements

### Requirement: Refresh token rotation revocation
When a refresh token is used to obtain new tokens, the system SHALL blacklist the old refresh token's `jti` in Redis before issuing new tokens. The old refresh token SHALL NOT be usable after rotation.

#### Scenario: Successful refresh blacklists old token
- **WHEN** a valid refresh token is submitted to `POST /auth/refresh`
- **THEN** the old refresh token's `jti` is added to the Redis blacklist with TTL matching the token's remaining lifetime, and a new access_token and refresh_token are returned

#### Scenario: Replayed refresh token is rejected
- **WHEN** a refresh token that has already been rotated is submitted to `POST /auth/refresh`
- **THEN** the system returns 401 with detail "Refresh token has been revoked"

### Requirement: Explicit cookie path
All auth cookies SHALL include an explicit `path=/` attribute.

#### Scenario: Set-cookie includes path
- **WHEN** the system issues a `Set-Cookie` header for `refresh_token` (on login, register, refresh, or OAuth)
- **THEN** the header includes `Path=/`

#### Scenario: Delete-cookie includes path
- **WHEN** the system issues a `Set-Cookie` header to delete `refresh_token` (on logout)
- **THEN** the header includes `Path=/`

### Requirement: Logout blacklists refresh token
The logout endpoint SHALL blacklist the refresh token's `jti` in Redis with a TTL equal to the token's remaining lifetime, and SHALL delete the `refresh_token` cookie from the browser.

#### Scenario: Logout with valid cookie
- **WHEN** a user calls `POST /auth/logout` with a valid `refresh_token` cookie
- **THEN** the token's `jti` is blacklisted in Redis, and the `refresh_token` cookie is deleted

#### Scenario: Logout without cookie
- **WHEN** a user calls `POST /auth/logout` without a `refresh_token` cookie
- **THEN** the system returns 204 with no error (graceful no-op)
