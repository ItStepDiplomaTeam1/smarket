## Context

The current registration endpoint (`POST /auth/register`) automatically registers, activates, and issues JWT access tokens to users immediately. To prevent spam and ensure email ownership, we need to restructure this into a two-step flow:
1. User requests registration by providing email and password. The system stores the credentials with `is_active = False`, generates a 6-digit verification code, stores it in Redis, and emails it.
2. User submits the code to `POST /auth/register/verify`. The system checks it against Redis, sets `is_active = True`, and returns the active user session and JWT tokens.

## Goals / Non-Goals

**Goals:**
- Shift default registration to a pending state (`is_active = False`).
- Store OTP codes securely in Redis under `otp:register:<email>` with a 5-minute TTL.
- Add a verification endpoint `/register/verify` to complete registration.
- Maintain immediate activation for Google and Telegram OAuth logins.

**Non-Goals:**
- Implementing multi-factor authentication (MFA) for standard logins.
- Changing the structure of the existing database table.

## Decisions

### 1. Place Redis Storage Logic in `otp.py`
- **Choice**: Extend the recently created `services/auth_service/plugins/security/otp.py` to handle Redis set/get operations.
- **Rationale**: Keeps the router code clean and testable, decoupling Redis-specific operations from endpoint validation.

### 2. Immediate Activation for OAuth
- **Choice**: Keep OAuth routers (`routers/oauth.py`) creating active users (`is_active = True`) immediately.
- **Rationale**: Third-party providers (Google, Telegram) have already verified the user's identity/email, so a second verification step is redundant and degrades user experience.

### 3. Handle Duplicate Registration Attempts
- **Choice**:
  - If email is registered and active (`is_active = True`): Return `409 Conflict`.
  - If email is registered but inactive (`is_active = False`): Update their password to the newly provided one, regenerate the OTP, store it, and resend the email.
- **Rationale**: Allows users to retry registration if they made a typo in the password or if their previous OTP expired, without polluting the database with duplicate rows or locking them out.

### 4. Schema Changes
Add the following to `shared/DTO.py`:
- `VerifyOTPRequest`:
  ```python
  class VerifyOTPRequest(BaseModel):
      email: EmailStr
      code: str
  ```
- `RegisterPendingResponse`:
  ```python
  class RegisterPendingResponse(BaseModel):
      message: str
      email: str
  ```
