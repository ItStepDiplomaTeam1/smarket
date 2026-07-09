## Context

The current Telegram login flow uses `window.Telegram.Login.auth({ bot_id, request_access: 'write' }, callback)` from the Telegram JS SDK. This opens a popup to `oauth.telegram.org`. On production (Cloudflare Pages), Firefox ETP and Safari ITP block this popup, and even when it opens, cross-origin `postMessage` communication from the popup back to the opener is frequently stripped. The result is "Telegram authentication failed or popup closed" with no user-facing recourse.

## Goals / Non-Goals

**Goals:**
- Replace the popup-based Telegram login with a full-page redirect flow
- User clicks button → navigates to Telegram → authorizes → redirected back to the app
- Handle Telegram's callback data from URL hash on a dedicated route
- POST auth data to `POST /api/v1/auth/telegram` (existing backend endpoint, no backend changes)
- On success: store JWT, redirect to home
- On failure: redirect to `/auth` with error message
- Visible on all browsers including Firefox ETP and Safari ITP

**Non-Goals:**
- Changing the backend auth_service telegram endpoint or database schema
- Adding new OAuth providers or modifying Google OAuth flow
- Refactoring the auth store or routing system

## Decisions

### 1. Full-page redirect instead of popup
- **Problem**: Popup-based OAuth is blocked by Firefox ETP and Safari ITP. The Telegram JS SDK's `window.Telegram.Login.auth` opens popups asynchronously, losing user activation context. Even when popups open, cross-origin `postMessage` is frequently blocked.
- **Solution**: Navigate the entire page to `https://oauth.telegram.org/auth?bot_id=<ID>&origin=<ORIGIN>&request_access=write&return_to=<CALLBACK_URL>`. After user authorization, Telegram redirects the browser to `return_to` with auth data in the URL fragment (`#tgAuthResult=...` or individual query params).
- **Why redirect wins**: Bypasses ALL popup blockers because it's a standard navigation. The auth data comes back in the URL itself — no `postMessage` needed. Works identically across all browsers.

### 2. Dedicated callback route `/auth/telegram/callback`
- **Problem**: The redirect returns to a URL with Telegram auth data. The main auth page can't distinguish a Telegram callback from a normal page load.
- **Solution**: A new route `/auth/telegram/callback` that:
  1. Reads Telegram auth data from URL hash on mount
  2. POSTs it to `POST /api/v1/auth/telegram`
  3. On success → stores JWT → navigates to `/`
  4. On failure → navigates to `/auth?error=telegram_failed`
- **Why dedicated route**: Clean separation of concerns. The callback page is a thin handler — no UI rendering, just data extraction and redirect.

### 3. Telegram callback data format
- When Telegram redirects back, it sends auth data in the URL fragment as `tgAuthResult` encoded JSON or as individual query parameters. The callback page will handle both formats by parsing `window.location.hash` and `window.location.search`.

### 4. No backend changes
- The existing `POST /auth/oauth/telegram` endpoint already accepts `TelegramAuthSchema` (id, first_name, last_name, username, photo_url, auth_date, hash) and performs HMAC validation + user creation/login.
- The callback page sends the exact same payload the TelegramLoginButton used to send via the SDK callback — no backend changes needed.

### 5. Remove Telegram JS SDK script loading
- The `useEffect` that loads `telegram-widget.js` will be removed entirely. The redirect flow uses standard browser navigation — no SDK needed.

## Risks / Trade-offs

- **[Risk]** User abandons during redirect to Telegram and never comes back.
  - **Mitigation**: Acceptable trade-off — same as any OAuth redirect flow (Google, Facebook). The user can always click the button again.
- **[Risk]** Telegram auth data in URL could be exposed via referrer headers or browser history.
  - **Mitigation**: The auth data contains a cryptographic HMAC hash — it's already signed. Expires after 24 hours. We extract and POST it immediately, then navigate away (replacing history state if possible).
- **[Risk]** The Telegram redirect might include auth data as query params (logged on servers) vs fragment (not sent to server).
  - **Mitigation**: Handle both `location.search` and `location.hash` at the callback page. Read Telegram docs to confirm the actual format.
- **[Risk]** Timing — the redirect flow adds one extra round trip (app → Telegram → app), which feels slightly slower than a popup.
  - **Mitigation**: Unavoidable but negligible compared to "completely broken on Firefox." Show a brief loading state on the callback page.
