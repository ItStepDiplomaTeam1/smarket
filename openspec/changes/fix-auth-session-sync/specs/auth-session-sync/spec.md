## ADDED Requirements

### Requirement: Global Session Validation on Mount
The system SHALL validate the current authenticated user session when the application initializes.

#### Scenario: Expired session triggers logout on mount
- **WHEN** the application loads and `isAuthenticated` is true, but the session token is invalid or expired
- **THEN** the system SHALL automatically clear the user authentication state and reset layout header details

### Requirement: Authenticated User Auth Page Protection
The system SHALL redirect authenticated users away from the login and registration pages.

#### Scenario: Logged-in user attempts to visit auth page
- **WHEN** an authenticated user navigates to `/auth`
- **THEN** the system SHALL redirect them to the home page (`/`)
