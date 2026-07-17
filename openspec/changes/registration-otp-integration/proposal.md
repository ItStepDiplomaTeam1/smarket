## Why

Currently, registration automatically activates users and issues access tokens immediately without validating that the user owns the email address. Integrating email OTP verification during registration is required to ensure email ownership, reduce spam accounts, and improve security.

## What Changes

- **BREAKING**: Modify the `POST /auth/register` endpoint. Instead of creating an active user and returning JWT tokens immediately, it will now create an inactive user (or update an existing inactive user), generate an OTP code, store it in Redis, send a verification email, and return a pending status message.
- **NEW**: Add a `POST /auth/register/verify` endpoint. This endpoint accepts the user's email and the OTP verification code. If the code is valid, it activates the user (`is_active = True`), commits to the database, caches the user, and issues the JWT access/refresh tokens (returning the same response schema as the old `/register` endpoint).
- **NEW**: Define new request schemas in `shared/DTO.py` (e.g., `VerifyOTPRequest` and updated responses).
- **Decouple**: Ensure Google and Telegram OAuth bypass OTP verification, as their identities are already verified by the external provider.

## Capabilities

### New Capabilities
- `registration-otp`: Two-step user registration workflow with email OTP verification.

### Modified Capabilities
<!-- No modified capabilities; this is a new capability for the auth service -->

## Impact

- **Database**: The `User` records created during `POST /auth/register` will have `is_active = False` until verified.
- **APIs**:
  - `POST /auth/register`: Return type changes from `RegisterResponse` to a status message (`RegisterPendingResponse`).
  - `POST /auth/register/verify`: New endpoint returning `RegisterResponse` (tokens + user).
- **Dependencies**: Relies on `redis` (already in `pyproject.toml`) and the recently added `otp` and `email_sender` utilities.
