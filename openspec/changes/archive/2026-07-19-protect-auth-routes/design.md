## Context

We previously resolved session validation on mount and route protection for `/auth`. The same protection needs to be applied to other authentication-related routes like `/register` (RegisterPage), `/forgot-password` (ForgotPasswordPage), and `/login` (LoginPage).

## Goals / Non-Goals

**Goals:**
- Apply route guards to `/register`, `/forgot-password`, and `/login` pages.
- Redirect authenticated users (`isAuthenticated === true`) to `/` with `{ replace: true }`.

## Decisions

### Decision 1: Guard on Page-Level
- **Option A (Chosen):** Apply `useEffect` hooks in the wrapper Page components (`RegisterPage.tsx`, `ForgotPasswordPage.tsx`, and `LoginPage.tsx`).
  * *Rationale:* This mirrors our current `/auth` routing guard design and isolates page-level redirection logic from core business modules like `Create` or `ForgotPass`.

## Risks / Trade-offs

- **Risk:** Flash of unauthenticated content before redirection.
  * *Mitigation:* Render `null` or a loading skeleton if the user is already authenticated while the redirect takes place.
