## 1. Setup and Configurations

- [x] 1.1 Add `aiosmtplib` to the `dependencies` list in `pyproject.toml`
- [x] 1.2 Add the SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) to `.env.example`
- [x] 1.3 Update local `.env` file with test configurations

## 2. Core Implementation

- [x] 2.1 Implement secure OTP generator in `services/auth_service/plugins/security/otp.py` using the `secrets` module
- [x] 2.2 Create email template files: `services/auth_service/templates/misc/email-letter.html` and `services/auth_service/templates/misc/receipt.html` with appropriate placeholders
- [x] 2.3 Implement the asynchronous email client in `services/auth_service/plugins/security/email_sender.py` using `aiosmtplib`, `loguru` for logging, absolute imports, and template replacement support

## 3. Verification and Testing

- [x] 3.1 Write tests verifying the secure OTP generator length and randomness
- [x] 3.2 Write integration tests demonstrating mailer behavior under both configured and unconfigured (fallback console logger) SMTP setups
