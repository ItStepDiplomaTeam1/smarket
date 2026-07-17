## Why

The current Telegram login implementation has two major issues:
1. It returns `401 Unauthorized` on the live server because the backend is configured with a dummy `TELEGRAM_BOT_TOKEN`, failing the HMAC validation.
2. The Telegram login button is using the standard iframe widget, which causes browser popup blockers to trigger in fingerprinting-protection mode due to dynamic script re-renders (lack of direct user activation).
Additionally, the Facebook login is obsolete and must be removed, and the Telegram login button needs to be visually aligned with the "Continue with Google" button.

## What Changes

- **REMOVE** Facebook login button from the Registration page, Login Popup, and Auth page.
- **RESTYLE** Telegram login button to match the Google login button's layout, fonts, borders, hover effects, and height.
- **REWRITE** `TelegramLoginButton.tsx` to load the Telegram widget SDK globally and trigger `window.Telegram.Login.auth` programmatically on click. This ensures direct user activation and avoids popup blockers.
- **ADD** `VITE_TELEGRAM_BOT_ID` to the React app's `.env` files to allow targeting the correct bot in production.
- **FIX** the 401 validation issue by providing instructions on setting the correct `TELEGRAM_BOT_TOKEN` on the server and ensure local tests pass.

## Capabilities

### New Capabilities
*None*

### Modified Capabilities
- `telegram-auth`: Change the frontend behavior from embedding the standard Telegram widget iframe to rendering a custom HTML button and triggering authorization programmatically.

## Impact

- **Frontend (`apps/react/frontend/my-react-app`)**:
  - `src/modules/Auth/components/TelegramLoginButton.tsx`: Changed to a custom button using JS SDK.
  - `src/modules/Auth/components/Create.tsx`, `src/modules/Auth/components/Popup.tsx`, `src/pages/Auth/index.tsx`: Facebook button removed, TelegramLoginButton updated.
  - `.env`, `.env.example`: Added `VITE_TELEGRAM_BOT_ID`.
- **Backend (`services/auth_service`)**:
  - Verification that `TELEGRAM_BOT_TOKEN` is loaded correctly and that the endpoint supports automatic registration (which it already does, but we must verify that it registers new users and logs in existing ones).
