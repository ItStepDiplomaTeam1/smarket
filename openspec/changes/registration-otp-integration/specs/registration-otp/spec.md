## ADDED Requirements

### Requirement: Request Registration OTP
The system SHALL support requesting a registration OTP by initiating the registration workflow.
The system SHALL prevent registration for already active email addresses.
The system SHALL create a user record with `is_active = False` (or update an existing inactive record's password) if the email is not registered/active, generate a 6-digit verification code, save it in Redis (with a 5-minute TTL), and send it to the user's email.

#### Scenario: Request registration for a new email
- **WHEN** a POST request to `/auth/register` is made with a new email and a valid password
- **THEN** the system inserts the user with `is_active = False`, saves a 6-digit OTP in Redis under `otp:register:<email>`, sends the verification email, and returns a success status with a pending verification message

#### Scenario: Request registration for an existing active user
- **WHEN** a POST request to `/auth/register` is made with an email that is already registered and active
- **THEN** the system rejects the request and returns a 409 Conflict status code

#### Scenario: Request registration again for an existing inactive user
- **WHEN** a POST request to `/auth/register` is made with an email that exists but is inactive
- **THEN** the system updates the user's hashed password, regenerates a new 6-digit OTP, stores it in Redis, sends the new verification email, and returns a pending verification message

### Requirement: Verify Registration OTP
The system SHALL verify the registration OTP code submitted by the user.
If the verification code matches the value stored in Redis, the system SHALL update the user record to `is_active = True`, commit it to the database, remove the code from Redis, and return JWT access/refresh tokens along with the user info.

#### Scenario: Verification with a valid code
- **WHEN** a POST request to `/auth/register/verify` is made with a correct code for a pending email registration
- **THEN** the system sets `is_active = True` in the database, caches the authenticated user, deletes the code from Redis, sets the HttpOnly refresh token cookie, and returns a 200 OK with the access token and user info

#### Scenario: Verification with an invalid or expired code
- **WHEN** a POST request to `/auth/register/verify` is made with an incorrect, missing, or expired verification code
- **THEN** the system rejects the request and returns a 400 Bad Request status code
