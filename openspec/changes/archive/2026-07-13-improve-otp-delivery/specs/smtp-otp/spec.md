## MODIFIED Requirements

### Requirement: Asynchronous Email Dispatch
The system MUST asynchronously transmit emails using `aiosmtplib` to a specified recipient.
The system MUST read its SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) from environment variables.
The system MUST format the sender field as `"Smarket <SMTP_USER>"` (friendly display name).
The system MUST inject system-generated transactional email headers (`Auto-Submitted: auto-generated`, `X-Auto-Response-Suppress: All`) to improve inbox placement.
The system MUST support a graceful fallback: if any SMTP credential is missing, email dispatch MUST be bypassed, and the email's content MUST be printed to the system logs instead.

#### Scenario: Sending email with complete configuration and transactional headers
- **WHEN** SMTP credentials are fully configured and a request to send an email is made
- **THEN** the system connects asynchronously, establishes a secure connection, injects the sender display name and headers, transmits the email, and logs a success status

#### Scenario: Fallback logging when SMTP is disabled
- **WHEN** SMTP credentials are incomplete or missing, and a request to send an email is made
- **THEN** the system bypasses sending, logs a warning about disabled email service, and prints the email recipient, subject, and text content to the logs

### Requirement: OTP Email Transmission
The system SHALL send a formatted verification email containing the generated OTP to the user's email.
The system SHALL read an HTML template from a predefined location, replacing the placeholder `{{ code }}` with the generated OTP code.
The email template and subject line SHALL be localized in Ukrainian.
The email dispatch SHALL include a detailed plain-text version containing identical informational content and support signature to optimize the text-to-HTML ratio and prevent spam classification.

#### Scenario: Send verification OTP email in Ukrainian with plain text alternative
- **WHEN** requested to send an OTP email to a user
- **THEN** the system reads the localized Ukrainian HTML template, replaces `{{ code }}` with the OTP, constructs a rich plain-text backup, and calls the asynchronous email dispatcher to send it
