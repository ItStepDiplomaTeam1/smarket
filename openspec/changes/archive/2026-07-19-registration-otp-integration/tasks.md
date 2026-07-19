## 1. DTO & Helper Extension

- [x] 1.1 Add `VerifyOTPRequest` and `RegisterPendingResponse` to `shared/DTO.py`
- [x] 1.2 Implement Redis OTP storage and verification helper functions (`save_otp`, `verify_otp`) in `plugins/security/otp.py`

## 2. Router Refactoring

- [x] 2.1 Refactor `POST /auth/register` in `routers/auth.py` to create an inactive user (`is_active = False`), generate and store a 6-digit OTP, send it via email, and return `RegisterPendingResponse`
- [x] 2.2 Implement the verification endpoint `POST /auth/register/verify` in `routers/auth.py` that validates the OTP, activates the user, caches the session, and issues JWT tokens

## 3. Verification & Testing

- [x] 3.1 Update existing registration tests in `tests/test_main.py` to assert the new two-step registration flow
- [x] 3.2 Add new integration tests verifying correct OTP storage/verification and user activation pathways
