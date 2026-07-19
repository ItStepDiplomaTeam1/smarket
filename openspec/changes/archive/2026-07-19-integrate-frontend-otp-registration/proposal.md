## Why

Currently, the frontend registration form does not support the two-step verification (OTP) flow. When a user submits their registration details, the backend sends an OTP email and expects a verification request, but the frontend lacks the UI and logic to capture and submit this OTP code. This change integrates the OTP modal and verification API into the frontend registration flow.

## What Changes

- Add a beautiful animated OTP code verification modal to the frontend registration screen.
- Integrate the OTP modal with a 6-digit input and automated focus shifting.
- Call the `/api/v1/auth/register/verify` endpoint via a TanStack query mutation when the OTP is submitted.
- Auto-login the user, save their credentials/tokens in the Zustand store, and redirect them to the home page upon successful verification.
- Show toast notifications for incorrect or expired codes.

## Capabilities

### New Capabilities
- `local-user-registration`: Frontend registration flow with email, password, and OTP code verification.

### Modified Capabilities

## Impact

- `apps/react/frontend/my-react-app/src/modules/Auth/components/Create.tsx`: Embed OTP modal and verification logic.
- `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts`: Implement TanStack query hook for OTP verification.
