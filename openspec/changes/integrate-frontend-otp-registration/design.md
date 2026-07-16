## Context

The backend `auth_service` implements a two-step registration flow:
1. `POST /register`: Registers a user as inactive and sends a 6-digit OTP code to their email.
2. `POST /register/verify`: Accepts `{ email, code }` to verify the OTP, activates the user account, sets the refresh token cookie, and returns access token + user details.

Currently, the frontend `Create.tsx` form registers a user but has no UI or logic to prompt for the OTP code or submit it to the verification endpoint.

## Goals / Non-Goals

**Goals:**
- Implement the client-side API hook for register verification (`/api/v1/auth/register/verify`).
- Update the frontend registration form (`Create.tsx`) to show an overlay modal asking for the 6-digit OTP after submitting credentials.
- Design a premium, animated UI for entering the OTP code (6 individual inputs with auto-focus shifting, backspace handling, and paste support).
- Implement countdown-based resend logic using the initial register endpoint.
- Connect successful verification with the global Zustand store to authenticate the user and redirect to home.

**Non-Goals:**
- Modifying backend endpoints or database schemas.
- Modifying Google/Telegram OAuth flows.

## Decisions

### 1. Verification Modal in Registration Page vs. Dedicated Route
We will implement an overlay modal directly in `Create.tsx` instead of a separate route.
*Rationale*: This keeps the user context alive, allowing easy retry or email correction if they entered the wrong email address initially.

### 2. UI Component for 6-Digit OTP Entry
Use a grid of 6 separate text fields controlled via state array and React refs.
*Behavior*:
- Typing a digit automatically shifts focus to the next field.
- Pressing Backspace on an empty field shifts focus to the previous field.
- Pasting a 6-digit number automatically splits and populates all 6 fields.

### 3. Resend OTP Mechanism
To resend the OTP, we re-trigger the registration mutation with the same user credentials.
*Rationale*: The backend is already designed to re-generate the OTP and resend the email if a registration request is submitted for an existing inactive user account.

## Risks / Trade-offs

* **[Risk]** User closes the modal or leaves the page before verifying.
  * *Mitigation*: Prompt the user or allow closing the modal which clears form state. Since their account is stored as `is_active=False`, they can re-register with the same email and get a new OTP.
* **[Risk]** Email delivery latency causing immediate resend spam.
  * *Mitigation*: Implement a 60-second countdown timer in the modal that disables the "Resend Code" button.
