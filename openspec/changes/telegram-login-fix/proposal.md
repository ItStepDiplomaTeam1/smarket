## Why

The current Telegram authentication flow fails because the frontend uses an incorrect/mismatched Bot ID and cannot parse the base64url-encoded `tgAuthResult` fragment returned by Telegram during the OAuth redirect flow. This prevents users from successfully registering or logging in using Telegram.

## What Changes

- Update `VITE_TELEGRAM_BOT_ID` in the frontend `.env` configuration and the default fallback values to match the actual Bot ID used by the backend.
- Update the frontend Telegram callback page to correctly detect, extract, and base64url-decode the `tgAuthResult` hash parameter from the callback URL.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `telegram-auth-callback`: The callback page MUST detect and base64url-decode the `tgAuthResult` parameter from the URL fragment (hash) or query string when extracting user authentication data.

## Impact

- Frontend configuration files: `.env`, `.env.example`.
- Frontend code files: `TelegramCallbackPage.tsx`, `TelegramLoginButton.tsx`, `Create.tsx`, `Popup.tsx`, `pages/Auth/index.tsx`.
