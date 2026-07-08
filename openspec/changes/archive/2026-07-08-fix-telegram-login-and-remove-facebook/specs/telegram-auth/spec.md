## MODIFIED Requirements

### Requirement: Frontend Telegram Login Widget
The frontend React application MUST display a custom Telegram Login button.

#### Scenario: Click custom Telegram login button
- **WHEN** the user clicks the custom Telegram Login button
- **THEN** the system triggers the Telegram login popup programmatically via JavaScript SDK, receives authentication data, and dispatches it to the gateway/auth endpoint
