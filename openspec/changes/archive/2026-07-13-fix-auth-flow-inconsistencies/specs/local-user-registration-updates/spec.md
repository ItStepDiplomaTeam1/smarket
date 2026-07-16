## ADDED Requirements

### Requirement: Save and retrieve user name in local registrations
The authentication service SHALL accept the user's name during registration, store it within the user's settings in the database, and return it as the `username` field in the user profile response.

#### Scenario: Name is saved during registration and returned from profile endpoint
- **WHEN** a user registers with a name, email, and password, and subsequently retrieves their profile
- **THEN** the system stores the name in the user settings JSONB column and returns it as the `username` in the `/api/v1/auth/me` response

### Requirement: Login form extracts error details from response
The frontend login form SHALL extract error descriptions from the `detail` property of failed Axios responses.

#### Scenario: Login fails with validation or credentials error
- **WHEN** the login request fails and returns an HTTP 401/422 status with a `detail` string
- **THEN** the login form extracts this `detail` string and renders it as the error message to the user
