## MODIFIED Requirements

### Requirement: Frontend Telegram Login Widget
The frontend React application MUST display a custom Telegram Login button.

#### Scenario: Click custom Telegram login button
- **WHEN** the user clicks the custom Telegram Login button
- **THEN** the browser performs a full-page redirect to `https://oauth.telegram.org/auth` for authorization, and after successful authorization, the user is redirected back to the callback page which receives the authentication data and dispatches it to the gateway/auth endpoint
