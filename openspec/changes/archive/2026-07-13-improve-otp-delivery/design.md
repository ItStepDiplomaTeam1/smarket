## Context

The system sends automated verification OTP codes and password reset links to users via email using `aiosmtplib`. Currently, these emails suffer from deliverability issues because of plain text bodies that are too brief and don't match the HTML counterpart, lack of formal headers indicating automated mail, a raw email address in the `From` field, and english language strings on a Ukrainian-targeted site.

## Goals / Non-Goals

**Goals:**
- Localize the HTML template to Ukrainian with correct HTML `lang` attributes.
- Construct identical plain text fallback bodies for all transactional emails.
- Format the MIME `From` header to use a friendly display name.
- Inject auto-submitted headers in the `email_sender.py` module.

**Non-Goals:**
- Changing the actual SMTP delivery backend (e.g. replacing `aiosmtplib` with another library).
- Modifying the user registration or password reset router database transactions.

## Decisions

### 1. Hardcoded display name vs. database-driven display name
We will use a hardcoded friendly prefix `"Smarket <SMTP_USER>"` inside the code.
- *Alternatives considered*: Storing sender name in database or `.env`.
- *Rationale*: A simple hardcoded string is sufficient since the brand name (Smarket) is static.

### 2. Full synchronization of text and HTML bodies
We will expand the text body variable substitution to include a complete translation of the HTML body rather than just the code.
- *Rationale*: Improves text-to-HTML ratio and matches standard anti-spam recommendations.

## Risks / Trade-offs

- **[Risk]** The recipient mail client doesn't support Ukrainian UTF-8 encoding.
  - *Mitigation*: Ensure explicit UTF-8 parameters are set during MIME creation for headers and body parts.
