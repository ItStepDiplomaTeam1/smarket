## Context

The Telegram OAuth flow in Smarket fails to complete successfully due to two client-side configuration and parsing bugs:
1. The frontend `.env` config file and fallbacks inside multiple components use a wrong/mismatched Bot ID `7243912952`. The backend uses bot `smarket_verify_bot` with token `8912413936:AAGHg75Lvz2VA27_hT_FHL5JEug4zLtTULg` (Bot ID: `8912413936`).
2. When Telegram redirects the user back to the application via redirect OAuth, it passes the credentials in a base64url-encoded `#tgAuthResult` fragment. The frontend callback handler currently expects flat, unencoded query parameters like `id`, `hash`, and `auth_date`. As a result, the callback handler fails to parse the credentials, triggers an error state, and immediately redirects the user back to `/auth` (login page).

## Goals / Non-Goals

**Goals:**
- Correct the `VITE_TELEGRAM_BOT_ID` configuration in the frontend `.env` and fallback constants.
- Implement base64url-decoding of `#tgAuthResult` in the frontend callback page.
- Safely parse the decoded JSON payload and populate user credentials before passing them to the mutation.

**Non-Goals:**
- Modifying the backend endpoints or database schemas.
- Modifying Google OAuth or any other authentication flows.

## Decisions

### 1. Update VITE_TELEGRAM_BOT_ID to Match Backend
- **Choice**: Change the bot ID from `7243912952` to `8912413936`.
- **Rationale**: The backend `auth_service` verifies signatures using the `TELEGRAM_BOT_TOKEN` corresponding to bot ID `8912413936`. The frontend and backend must use the same bot for signatures to match.

### 2. Parse and Decode `tgAuthResult` inside `getTelegramParams`
- **Choice**: Keep the return type of `getTelegramParams` as `Record<string, string>`, but add logic to extract, base64url-decode, and parse `tgAuthResult` if it exists.
- **Rationale**: Minimizes code churn on the callback page. The rest of the callback page logic can remain unchanged since it will receive the individual parameters (e.g. `id`, `hash`, `auth_date`) once they are extracted from the decoded JSON.

## Risks / Trade-offs

- **[Risk]** Base64 URL parsing fails due to missing padding or standard base64 character differences.
  - **Mitigation**: Standardize the Base64URL string by replacing `-` with `+`, `_` with `/`, and adding appropriate padding (`=`) to ensure compatibility with `atob`.
