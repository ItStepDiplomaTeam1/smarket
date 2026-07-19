## 1. API Integration

- [x] 1.1 Update registration types/interfaces in `Create.tsx` and `useAuthApi.ts` to expect `{ message: string; email: string }` from `/api/v1/auth/register`.
- [x] 1.2 Implement the `useRegisterVerify` TanStack mutation hook in `useAuthApi.ts` that sends `{ email: string; code: string }` to `/api/v1/auth/register/verify` and authenticates the user on success.

## 2. OTP Verification UI Component

- [x] 2.1 Create a premium, animated OTP Verification modal (using Tailwind transitions, custom scale animations, and dark mode compliance).
- [x] 2.2 Implement 6 individual digit input fields for OTP entry, with auto-focus forward shifting on typing, backward shifting on backspace, and paste support.
- [x] 2.3 Add a 60-second resend countdown timer to disable the "Resend code" button to prevent backend spamming.
- [x] 2.4 Wire the "Resend code" action to re-trigger the register mutation.

## 3. Integration & Testing

- [x] 3.1 Update `Create.tsx` to show the OTP modal on successful registration submission, storing the entered credentials in local component state.
- [x] 3.2 Hook the verification submission inside the modal to the `useRegisterVerify` mutation.
- [x] 3.3 Test registration, verification error handling (wrong code), OTP resending, and successful login redirect.
