# telegram-auth-callback Specification — Delta

## MODIFIED Requirements

### Requirement: Telegram OAuth callback handler
The frontend MUST handle the Telegram OAuth redirect callback at `/auth/telegram/callback`. The callback page MUST parse auth data from both the URL hash fragment (`#`) and the query string (`?`). If auth data is found in either location, the callback MUST extract it and POST to the backend. If auth data is missing from both, or the backend returns an error, the callback MUST display a user-visible error message.

#### Scenario: Successful Telegram authentication via URL hash
- **WHEN** the user authorizes the Telegram bot and is redirected back to the callback URL with auth data in the URL hash fragment (`#id=123&hash=abc&auth_date=123456`)
- **THEN** the callback page extracts the Telegram user data from the hash, POSTs it to `POST /api/v1/auth/telegram`, receives JWT tokens, stores them, and redirects the user to the home page

#### Scenario: Successful Telegram authentication via query string
- **WHEN** the user authorizes the Telegram bot and is redirected back to the callback URL with auth data in the query string (`?id=123&hash=abc&auth_date=123456`)
- **THEN** the callback page extracts the Telegram user data from the query string, POSTs it to `POST /api/v1/auth/telegram`, receives JWT tokens, stores them, and redirects the user to the home page

#### Scenario: Backend returns error during Telegram auth
- **WHEN** the callback page POSTs auth data to the backend and the backend returns an error (e.g., 401 Invalid signature)
- **THEN** the callback page displays a visible error message to the user and does NOT silently redirect to `/auth`

#### Scenario: Auth data missing from both hash and query string
- **WHEN** the callback page loads but auth data (`id`, `hash`, `auth_date`) is absent from both the URL hash and query string
- **THEN** the callback page displays a visible error message indicating authentication failed, and after a short delay redirects to `/auth`
