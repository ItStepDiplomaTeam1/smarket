## ADDED Requirements

### Requirement: Trigger OTP verification modal upon registration submit
When the user submits valid registration details (email and password) on the register page, the system SHALL show an OTP verification modal.

#### Scenario: Register submit shows OTP modal
- **WHEN** the user enters a valid email and password and clicks the register submit button
- **THEN** the system requests the backend to send an OTP and displays a modal dialog prompting the user for the 6-digit code

### Requirement: 6-digit OTP entry and validation
The verification modal SHALL accept a 6-digit verification code, validate it with the backend, and automatically log the user in on success.

#### Scenario: Valid OTP code entered
- **WHEN** the user inputs the correct 6-digit verification code and submits it
- **THEN** the system validates the code with the backend, marks the account as verified, stores the access token, and redirects the user to the home page

#### Scenario: Invalid OTP code entered
- **WHEN** the user inputs an incorrect or expired 6-digit code and submits it
- **THEN** the system displays an error message indicating that the code is invalid or has expired and keeps the modal open

### Requirement: Resend verification code
The verification modal SHALL allow the user to request a new verification code.

#### Scenario: User requests code resend
- **WHEN** the user clicks the "Resend Code" link/button in the modal
- **THEN** the system requests the backend to generate and send a new OTP and displays a success notification
