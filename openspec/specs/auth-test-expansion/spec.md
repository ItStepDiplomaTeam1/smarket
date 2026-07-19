# auth-test-expansion Specification

## Purpose
TBD - created by archiving change backend-test-coverage. Update Purpose after archive.
## Requirements
### Requirement: Google OAuth login flow
The `auth_service` SHALL support Google OAuth login: validate the Google ID token, extract the email, and either create a new user (if the email is new) or issue access + refresh tokens for an existing user.

#### Scenario: New Google user is registered and logged in
- **WHEN** a valid Google ID token is sent to the OAuth endpoint and the email has not been seen before
- **THEN** the service MUST create a new `User` row with `hashed_password` set to a random/empty value (since password is not used for OAuth users), MUST set `is_active=True`, and MUST return access + refresh tokens

#### Scenario: Existing Google user is logged in
- **WHEN** a valid Google ID token is sent and the email already belongs to an active user
- **THEN** the service MUST NOT create a duplicate user, MUST return access + refresh tokens, and MUST NOT re-hash the password

#### Scenario: Invalid Google ID token is rejected
- **WHEN** the OAuth endpoint receives an ID token that fails Google verification
- **THEN** the service MUST respond with HTTP 401 and MUST NOT create a user or issue tokens

### Requirement: Telegram OAuth signature validation
The `auth_service` SHALL validate Telegram login data by recomputing the HMAC-SHA256 of the credential payload using a hash of the bot token, comparing it to the `hash` field, and rejecting payloads older than 24 hours.

#### Scenario: Valid Telegram auth data
- **WHEN** Telegram auth data is received with a `hash` that matches the recomputed HMAC and the auth_date is within 24 hours
- **THEN** the service MUST accept the credentials, find-or-create the user by `telegram_id`, and issue tokens

#### Scenario: Expired Telegram auth data
- **WHEN** the `auth_date` is older than 24 hours
- **THEN** the service MUST reject the payload with HTTP 401 and MUST NOT issue tokens, regardless of signature validity

#### Scenario: Tampered signature
- **WHEN** the `hash` field does not match the recomputed HMAC
- **THEN** the service MUST reject the payload with HTTP 401 and MUST NOT issue tokens

### Requirement: Password recovery flow
The `auth_service` SHALL implement a password recovery flow: on request it stores a single-use reset token in Redis with a 15-minute TTL, sends a recovery email containing a link with the token, and on reset verifies the token and updates the hashed password.

#### Scenario: Forgot password stores token and sends email
- **WHEN** a user submits a valid email to the forgot-password endpoint
- **THEN** the service MUST store a reset token in Redis with a 15-minute TTL and MUST send a recovery email containing a link with that token

#### Scenario: Reset password with valid token
- **WHEN** the reset endpoint is called with a token that exists in Redis and a new valid password
- **THEN** the service MUST update the user's `hashed_password`, MUST delete the token from Redis (single-use), and MUST return success

#### Scenario: Reset password with expired or unknown token
- **WHEN** the reset endpoint is called with a token that is not present in Redis (expired or never existed)
- **THEN** the service MUST respond with HTTP 400 (or 404) and MUST NOT modify any user's password

### Requirement: Refresh token rotation
The `auth_service` SHALL, on a successful refresh, issue a new refresh token and blacklist the previous refresh token in Redis.

#### Scenario: Valid refresh rotates to a new refresh token
- **WHEN** the refresh endpoint receives a valid refresh token cookie
- **THEN** the service MUST issue a new access token, issue a new refresh token, and MUST add the old refresh token's id to the Redis blacklist

#### Scenario: Blacklisted refresh token is rejected
- **WHEN** the refresh endpoint receives a refresh token whose id is present in the Redis blacklist
- **THEN** the service MUST respond with HTTP 401 and MUST NOT issue any new tokens

