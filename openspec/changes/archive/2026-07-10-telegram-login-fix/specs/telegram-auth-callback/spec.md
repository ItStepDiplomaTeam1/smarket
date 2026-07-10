# telegram-auth-callback Specification — Delta

## MODIFIED Requirements

### Requirement: Telegram OAuth callback handler
The frontend MUST handle the Telegram OAuth redirect callback at `/auth/telegram/callback`. The callback page MUST detect and base64url-decode the `tgAuthResult` parameter from the URL fragment (hash) or query string when extracting user credentials.

#### Scenario: Successful Telegram authentication via redirect
- **WHEN** the user authorizes the Telegram bot and is redirected back to the callback URL with auth data wrapped in the `tgAuthResult` base64url-encoded hash parameter
- **THEN** the callback page base64url-decodes `tgAuthResult`, parses the nested JSON user data, POSTs it to `POST /api/v1/auth/telegram`, receives JWT tokens, stores them, and redirects the user to the home page

#### Scenario: Failed Telegram authentication via redirect
- **WHEN** the user is redirected back to the callback URL but the `tgAuthResult` data is missing, malformed, or signature verification fails on the backend
- **THEN** the callback page redirects the user to `/auth` with an error indicator
