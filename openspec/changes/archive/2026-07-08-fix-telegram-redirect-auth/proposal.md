## Why

The current Telegram login uses `window.Telegram.Login.auth` which opens a popup to `oauth.telegram.org`. Firefox's Enhanced Tracking Protection (ETP) and Safari's Intelligent Tracking Prevention (ITP) block these popups or strip cross-origin `postMessage` communication, making Telegram login fail silently for a significant portion of users with "Telegram authentication failed or popup closed".

## What Changes

- **REWRITE** Telegram login flow from popup-based to full-page redirect
- **ADD** dedicated `/auth/telegram/callback` route on the frontend to handle Telegram redirect data
- **REMOVE** `window.Telegram.Login.auth` JavaScript SDK call and its async script loading
- **MODIFY** `TelegramLoginButton.tsx` to perform `window.location` redirect to Telegram OAuth URL instead of calling SDK popup
- **ADD** callback handler logic on the Telegram callback page to extract auth data from URL hash, POST it to the backend, and redirect to home on success
- **NO CHANGE** to backend auth_service — the `/auth/oauth/telegram` endpoint already accepts the same `TelegramAuthSchema` payload

## Capabilities

### New Capabilities
- `telegram-auth-callback`: Frontend route and logic to receive Telegram OAuth redirect data, send it to the backend, and finalize authentication

### Modified Capabilities
- `telegram-auth`: Change the frontend login flow from programmatic popup (JS SDK) to full-page redirect with callback page. The backend validation and user creation remain unchanged.

## Impact

- **Frontend (`apps/react/frontend/my-react-app`)**:
  - `TelegramLoginButton.tsx`: Replace popup SDK call with `<a>` or button that navigates to Telegram auth URL
  - `src/pages/Auth/` or new `src/pages/TelegramCallback/`: New callback page to handle the redirect
  - `src/router/`: Add route for `/auth/telegram/callback`
  - No new dependencies — redirect flow uses native browser navigation
- **Backend (`services/auth_service`)**:
  - No changes — the existing `/auth/oauth/telegram` endpoint already handles the exact same TelegramAuthSchema payload
