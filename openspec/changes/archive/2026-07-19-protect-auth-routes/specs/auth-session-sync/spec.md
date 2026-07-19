## MODIFIED Requirements

### Requirement: Authenticated User Auth Page Protection
The system SHALL redirect authenticated users away from all authentication pages, including login, registration, and password recovery.

#### Scenario: Logged-in user attempts to visit auth-related pages
- **WHEN** an authenticated user navigates to `/auth`, `/register`, `/forgot-password`, or `/login`
- **THEN** the system SHALL redirect them to the home page (`/`)
