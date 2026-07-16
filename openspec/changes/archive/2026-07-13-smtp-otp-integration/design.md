## Context

The `auth_service` microservice is written in Python using FastAPI, SQLAlchemy, and Granian. Currently, there is no email dispatch mechanism. We need to implement an email delivery module that supports sending secure One-Time Passwords (OTPs) and payment receipts using asynchronous SMTP (via Google SMTP, or other providers).

## Goals / Non-Goals

**Goals:**
- Implement cryptographically secure OTP generation (digits only).
- Implement non-blocking email transmission using `aiosmtplib` and `loguru`.
- Support HTML template rendering with placeholders.
- Provide a graceful fallback to log OTP codes to the console if SMTP credentials are not set in the environment.

**Non-Goals:**
- Designing frontend UI for OTP input (out of scope for this backend service).
- Storing OTPs in database (verification storage/sessions is a separate concern).

## Decisions

### 1. Library Selection: `aiosmtplib`
- **Choice**: `aiosmtplib` instead of Python's built-in synchronous `smtplib`.
- **Rationale**: The microservice is fully asynchronous. Using synchronous `smtplib` would block the event loop during SMTP handshakes and transmission, reducing service throughput.

### 2. Logging Framework: `loguru`
- **Choice**: `loguru` (imported from `services.auth_service.plugins.logger`).
- **Rationale**: The project standardizes on `loguru` as specified in `auth_service/AGENTS.md`. We replace standard `logging` with `loguru`.

### 3. File Layout
We will place the logic under the existing plugins hierarchy:
- `services/auth_service/plugins/security/otp.py`: Contains `generate_secure_otp`.
- `services/auth_service/plugins/security/email_sender.py`: Contains `send_email`, `send_otp_email`, `send_receipt_email`.
- `services/auth_service/templates/misc/email-letter.html`: Template file for OTP.
- `services/auth_service/templates/misc/receipt.html`: Template file for receipts.

### 4. Dependency management
- **Choice**: Add `aiosmtplib` to dependencies in `pyproject.toml`.
- **Rationale**: Required for runtime imports.

## Risks / Trade-offs

- **Risk**: Google SMTP starts blocking requests or triggers rate-limits.
  - **Mitigation**: Handle exceptions during SMTP transmission, log detailed error messages, and ensure the application remains stable.
- **Risk**: Missing template files crash the email dispatch.
  - **Mitigation**: Implement `FileNotFoundError` catch blocks that fallback to clean plain text/basic HTML layouts.
