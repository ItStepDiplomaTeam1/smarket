## Why

Users need a quick and secure alternative authentication method alongside the existing Google OAuth. Enabling Telegram Login Widget allows users with Telegram accounts to register and log in instantly, which increases user conversion and simplifies the authentication flow.

## What Changes

- Add a Telegram authentication route (`POST /auth/telegram`) to `auth_service` that validates HMAC signatures sent by Telegram's Login Widget.
- Add `telegram_id` to the `User` database model in `auth_service` and run a corresponding database migration.
- Configure `gateway` to proxy Telegram authentication requests.
- Add `https://smarket-7go.pages.dev` to allowed CORS origins in `gateway`.
- Create a `TelegramLoginButton` frontend component in the React app (`apps/react`) to load the Telegram widget and handle callback authentication.
- Connect the frontend widget's authentication payload with the backend and update the Zustand global store upon successful login.

## Capabilities

### New Capabilities
- `telegram-auth`: Implements authentication and registration flow via Telegram Login Widget.

### Modified Capabilities

## Impact

- **Backend APIs**: Introduces a new endpoint `/api/v1/auth/telegram`.
- **Database Schema**: Adds a unique, nullable `telegram_id` column to the `User` table.
- **Frontend App**: Adds a Telegram Login button on login pages/modals.
