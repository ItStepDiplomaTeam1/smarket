## Why

Similar to the `/auth` route, other authentication-related routes like `/register` (registration), `/forgot-password` (password recovery), and `/login` (legacy login) are still accessible to already authenticated users. This leads to UX bugs where a logged-in user can visit the registration or login screen, which is confusing and non-standard.

## What Changes

- Add route guards to `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, and `LoginPage.tsx` so that already authenticated users are redirected back to the home page `/` immediately upon navigating to these routes.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `auth-session-sync`: Extend routing protection to cover all unauthenticated auth routes (`/register`, `/forgot-password`, `/login`).

## Impact

- **apps/react** frontend pages: `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, and `LoginPage.tsx` will receive hooks to check authentication state and redirect accordingly.
