# telegram-auth Specification

## Purpose
TBD - created by archiving change add-telegram-login. Update Purpose after archive.
## Requirements
### Requirement: Telegram HMAC validation
The system MUST validate the HMAC-SHA256 signature of the authentication data received from the Telegram Login Widget.

#### Scenario: Valid Telegram login signature
- **WHEN** authentication data with a valid hash and an auth_date newer than 24 hours is received
- **THEN** the system successfully validates the signature and proceeds with user login/registration

#### Scenario: Expired Telegram login data
- **WHEN** authentication data has an auth_date older than 24 hours
- **THEN** the system rejects the signature validation with a 401 Unauthorized status

#### Scenario: Malicious Telegram login signature
- **WHEN** authentication data has a modified hash or altered values
- **THEN** the system rejects the signature validation with a 401 Unauthorized status

### Requirement: User creation or login via Telegram
The system MUST register a new user or log in an existing user based on their Telegram ID, and synchronize their Telegram first name, last name, username, and avatar URL into the user settings JSONB.

#### Scenario: Existing user logs in
- **WHEN** a valid Telegram login request is received for a telegram_id that already exists in the database
- **THEN** the system authenticates the user, updates their settings JSONB with current Telegram profile metadata (first name, last name, username, photo URL), and returns standard JWT access and refresh tokens along with user settings

#### Scenario: New user registers
- **WHEN** a valid Telegram login request is received for a telegram_id that does not exist in the database
- **THEN** the system creates a new user with the telegram_id, generated placeholder email, password placeholder, and saves Telegram profile metadata (first name, last name, username, photo URL) in the settings JSONB field, and returns standard JWT access and refresh tokens along with user settings

### Requirement: Frontend Telegram Login Widget
The frontend React application MUST display a custom Telegram Login button.

#### Scenario: Click custom Telegram login button
- **WHEN** the user clicks the custom Telegram Login button
- **THEN** the browser performs a full-page redirect to `https://oauth.telegram.org/auth` for authorization, and after successful authorization, the user is redirected back to the callback page which receives the authentication data and dispatches it to the gateway/auth endpoint

