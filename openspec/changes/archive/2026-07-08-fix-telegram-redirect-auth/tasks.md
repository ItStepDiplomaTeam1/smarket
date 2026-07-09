## 1. Frontend: Rewrite TelegramLoginButton for Redirect Flow

- [x] 1.1 Rewrite `TelegramLoginButton.tsx` to render an `<a>` tag or button that navigates to Telegram OAuth URL instead of calling `window.Telegram.Login.auth` popup
- [x] 1.2 Remove `useEffect` that loads `telegram-widget.js` script and remove the SDK callback logic
- [x] 1.3 Compute the Telegram OAuth URL with `bot_id`, `origin`, `request_access`, and `return_to` parameters pointing to `/auth/telegram/callback`

## 2. Frontend: Add Telegram Callback Route and Page

- [x] 2.1 Add `/auth/telegram/callback` route to the router configuration
- [x] 2.2 Create `TelegramCallbackPage` component that reads Telegram auth data from URL hash/search on mount
- [x] 2.3 Implement callback logic: POST auth data to `POST /api/v1/auth/telegram`, on success store JWT and redirect to `/`, on failure redirect to `/auth?error=telegram_failed`

## 3. Verification

- [x] 3.1 Run frontend build (`tsc -b && vite build`) to verify TypeScript compiles successfully
- [x] 3.2 Run `auth_service` unit tests (`pytest`) to verify backend endpoint still works correctly
