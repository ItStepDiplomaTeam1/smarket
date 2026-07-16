## Why

Currently, the `auth_service` does not support email-based authentication or verification. Implementing SMTP OTP (One-Time Password) via a secure asynchronous mailer using Google SMTP is needed to enable email verification, improve authentication security, and support transaction/receipt email delivery in the future.

## What Changes

- Add `aiosmtplib` dependency for asynchronous email transmission over SMTP.
- Configure SMTP parameters (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) via environment variables in `.env` and `.env.example`.
- Introduce a secure OTP generation utility using Python's `secrets` module.
- Add an asynchronous mailer module that sends HTML/Text emails (OTP verification, payment receipts, etc.) using `aiosmtplib`.
- Provide template support for rendering emails (using simple HTML files with placeholders).
- Ensure graceful fallback: if SMTP parameters are missing, log verification codes to the console/logger rather than throwing errors.

## Capabilities

### New Capabilities
- `smtp-otp`: Secure OTP generation, asynchronous email sending using aiosmtplib, and email templates for authentication and receipt notifications.

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **Dependencies**: Adds `aiosmtplib` to dependencies in `pyproject.toml`.
- **Environment**: Requires new configuration variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) in `.env`.
- **APIs**: Provides internal helper functions for other endpoints to trigger OTP generation and email dispatch.
