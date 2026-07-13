## 1. Localization and Templates

- [x] 1.1 Localize HTML template in `email-letter.html` to Ukrainian and add `lang="uk"`
- [x] 1.2 Update `email_sender.py` to use a detailed plain-text fallback string with matching Ukrainian translation

## 2. SMTP Sender Headers and display name

- [x] 2.1 Update `From` address formatting in `email_sender.py` to `Smarket <SMTP_USER>`
- [x] 2.2 Inject `Auto-Submitted` and `X-Auto-Response-Suppress` headers in the `email_sender.py` message setup

## 3. Verification

- [x] 3.1 Run backend test suite via `uv run pytest` to ensure email sender utility tests pass
- [x] 3.2 Verify email template and plain-text fallback formatting matches the specifications
