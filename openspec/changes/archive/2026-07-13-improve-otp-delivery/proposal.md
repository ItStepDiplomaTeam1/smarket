## Why

Currently, transactional OTP emails sent during registration and password reset are occasionally flagged as spam by receiving mail servers (e.g. Gmail). This is caused by a low text-to-HTML ratio, lack of formal transactional headers, a language mismatch (English OTP template for a Ukrainian service), and lack of a formatted sender display name. Addressing these issues will maximize email deliverability (target score 10/10) and improve user trust.

## What Changes

- Update OTP HTML template to use Ukrainian text and specify language locale.
- Enhance Plain Text version of emails to match HTML template complexity (improving Text-to-HTML ratio).
- Add friendly sender display name (`Smarket <...>` instead of raw SMTP_USER email).
- Add standard auto-generated headers (`Auto-Submitted: auto-generated`, `X-Auto-Response-Suppress: All`) to classify messages as system-generated.
- Harmonize the subject line language.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `smtp-otp`: Add requirements for friendly sender names, transactional mail headers, robust plain text alternates, and locale-consistent email templates.

## Impact

- `services/auth_service/plugins/security/email_sender.py`: Modify how MIME messages are constructed (From, Auto-Submitted headers) and define descriptive `text_body`.
- `services/auth_service/templates/misc/email-letter.html`: Localize to Ukrainian (`lang="uk"`) and align copy.
