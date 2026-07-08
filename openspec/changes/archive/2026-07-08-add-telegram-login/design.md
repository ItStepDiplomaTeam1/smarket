## Context

We are introducing Telegram Login Widget support as an alternative OAuth/authentication provider. The Telegram Login Widget sends user authentication details including ID, username, names, avatar, and an HMAC hash for security validation.

The `auth_service` needs to support validating this hash using `TELEGRAM_BOT_TOKEN`, linking it to users in the database, and issuing JWT tokens. The API Gateway needs to proxy `/api/v1/auth/telegram` to `auth_service:8001/auth/telegram` and configure CORS properly. The Frontend needs a TelegramLoginButton component in apps/react.

## Goals / Non-Goals

**Goals:**
- Add `telegram_id` to the PostgreSQL `User` schema in `auth_service`.
- Create a `POST /auth/telegram` endpoint in `auth_service` validating HMAC signature.
- Log in existing or register new users based on `telegram_id`.
- Proxy `/api/v1/auth/telegram` requests via `gateway`.
- Add allowed CORS domain `https://smarket-7go.pages.dev` to `gateway`.
- Implement `TelegramLoginButton` React component loading official script and invoking backend callback.

**Non-Goals:**
- Linking existing Google accounts with Telegram accounts (can be added in future designs).
- Binding actual phone numbers or custom Telegram verification beyond the widget.

## Decisions

### 1. Handling Nullable `email` Constraint in `User` Table
- **Problem**: The `User.email` column has `nullable=False` and `unique=True` constraints. The Telegram Login Widget does not provide the user's email address.
- **Option A**: Make the `email` column nullable. (Requires database migration of existing users, could break downstream assumptions in cart/reviews/gateway).
- **Option B (Chosen)**: Generate a unique internal placeholder email for users registering via Telegram: `tg_<telegram_id>@smarket.local`.
- **Rationale**: Keeps existing schema constraints unchanged, prevents any compatibility issues with other services, and guarantees unique user identifiers.

### 2. User Creation Schema Details
- **Details**: When a user registers via Telegram, we will set their `email` to `tg_<telegram_id>@smarket.local`, `hashed_password` to `TELEGRAM_OAUTH_NO_PASSWORD`, `role` to `user`, and `is_active` to `True`. Their `telegram_id` is set to the integer provided by Telegram.
- **Names and Avatar**: We will store Telegram user settings (avatar URL, etc.) inside the `User.settings` JSONB field (e.g., `telegram_first_name`, `telegram_last_name`, `telegram_username`, and `photo_url`).

### 3. Telegram HMAC signature verification
- **Details**:
  1. Extract `hash` parameter from the payload.
  2. Collect all other received fields, sort them alphabetically by key.
  3. Create check string: `key1=value1\nkey2=value2\n...`.
  4. Generate secret key: `secret_key = SHA256(bot_token)`.
  5. Generate HMAC-SHA256 signature of the check string using `secret_key`.
  6. Match signature with the provided `hash`.
  7. Validate that `auth_date` is within the last 24 hours of current timestamp (`time.time()`).

## Risks / Trade-offs

- **[Risk]** Fake login data.
  - **Mitigation**: Strictly validate the HMAC signature and reject any requests where the calculated signature does not match the sent hash or `auth_date` has expired (>24 hours).
- **[Risk]** Empty database fields.
  - **Mitigation**: Use placeholder email addresses that are unique per Telegram ID and insert mock hashes for passwords to satisfy db constraints.
