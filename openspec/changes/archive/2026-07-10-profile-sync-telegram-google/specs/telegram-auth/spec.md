## MODIFIED Requirements

### Requirement: User creation or login via Telegram
The system MUST register a new user or log in an existing user based on their Telegram ID, and synchronize their Telegram first name, last name, username, and avatar URL into the user settings JSONB.

#### Scenario: Existing user logs in
- **WHEN** a valid Telegram login request is received for a telegram_id that already exists in the database
- **THEN** the system authenticates the user, updates their settings JSONB with current Telegram profile metadata (first name, last name, username, photo URL), and returns standard JWT access and refresh tokens along with user settings

#### Scenario: New user registers
- **WHEN** a valid Telegram login request is received for a telegram_id that does not exist in the database
- **THEN** the system creates a new user with the telegram_id, generated placeholder email, password placeholder, and saves Telegram profile metadata (first name, last name, username, photo URL) in the settings JSONB field, and returns standard JWT access and refresh tokens along with user settings
