## ADDED Requirements

### Requirement: User creation or login via Google OAuth
The system SHALL register a new user or log in an existing user based on their Google email address, and synchronize their Google name and picture URL into the user settings JSONB.

#### Scenario: Existing user logs in via Google
- **WHEN** a valid Google OAuth login request is received for an email address that already exists in the database
- **THEN** the system authenticates the user, updates their settings JSONB with current Google profile metadata (name, picture), and returns standard JWT access and refresh tokens along with user settings

#### Scenario: New user registers via Google
- **WHEN** a valid Google OAuth login request is received for an email address that does not exist in the database
- **THEN** the system creates a new user with the Google email, password placeholder, and saves Google profile metadata (name, picture, photo URL) in the settings JSONB field, and returns standard JWT access and refresh tokens along with user settings
