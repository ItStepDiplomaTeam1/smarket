## ADDED Requirements

### Requirement: Telegram OAuth callback handler
The frontend MUST handle the Telegram OAuth redirect callback at `/auth/telegram/callback`.

#### Scenario: Successful Telegram authentication via redirect
- **WHEN** the user authorizes the Telegram bot and is redirected back to the callback URL with auth data in the URL hash
- **THEN** the callback page extracts the Telegram user data, POSTs it to `POST /api/v1/auth/telegram`, receives JWT tokens, stores them, and redirects the user to the home page

#### Scenario: Failed Telegram authentication via redirect
- **WHEN** the user is redirected back to the callback URL but the auth data is missing, malformed, or the backend returns an error
- **THEN** the callback page redirects the user to `/auth` with an error indicator

### Requirement: Telegram login button triggers redirect
The Telegram login button MUST navigate the browser to the Telegram OAuth URL instead of opening a popup.

#### Scenario: User clicks Telegram login button
- **WHEN** the user clicks the Telegram Login button
- **THEN** the browser navigates to `https://oauth.telegram.org/auth` with the bot_id, origin, request_access, and return_to parameters
