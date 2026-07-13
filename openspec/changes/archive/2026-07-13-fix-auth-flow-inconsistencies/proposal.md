## Why

The current authentication system (email signups, logins, rate limits, and password recovery) contains multiple inconsistencies and bugs between the frontend and the backend. The user's name is discarded upon signup, login failures show generic errors due to mismatched payload parsing, the rate limiter blocks all users globally due to proxying, and the password recovery page is a mockup. Resolving these issues will make the authentication flow robust, correct, and production-ready.

## What Changes

- **Modified user registration and retrieval** to accept and persist user's name inside the `settings` JSONB column on the backend, ensuring it is preserved across sessions.
- **Fixed proxy-aware rate limiting** on the `auth_service` by replacing peer-IP rate limiting with custom header-based rate limiting (using `X-Forwarded-For` or `X-Real-IP`).
- **Corrected error message extraction** in the frontend login form (`Login.tsx`) to check for the backend-returned `detail` field rather than a non-existent `message` field.
- **Implemented password recovery flow** by adding password reset request and verification endpoints on the backend, and integrating them with the frontend forgot-password UI form.

## Capabilities

### New Capabilities
- `password-recovery`: Password recovery flow (forgot password) with email reset links.
- `proxy-aware-rate-limiting`: Rate limiting based on client IP forwarding headers instead of the proxy container IP.
- `local-user-registration-updates`: Fixes to username/name persistence and login form error message parsing.

### Modified Capabilities

## Impact

- `services/auth_service/shared/DTO.py`: Update `RegisterRequest` and auth responses.
- `services/auth_service/routers/auth.py`: Modify `/register` and `/me` endpoints; add password reset endpoints.
- `services/auth_service/plugins/security/limiters/auth_limiter.py`: Update rate limiter to use X-Forwarded-For header.
- `apps/react/frontend/my-react-app/src/modules/Auth/components/Login.tsx`: Fix error parsing from `.detail`.
- `apps/react/frontend/my-react-app/src/modules/Auth/components/Create.tsx`: Ensure name persistence.
- `apps/react/frontend/my-react-app/src/modules/Auth/components/ForgotPass.tsx`: Implement form state and API integration for password reset.
