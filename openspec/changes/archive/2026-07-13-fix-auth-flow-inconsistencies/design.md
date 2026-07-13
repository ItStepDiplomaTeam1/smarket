## Context

The current Smarket codebase has functional gaps in its authentication mechanisms: user's custom names are discarded during registration, IP-based rate limiting applies globally due to the API Gateway proxy, login form does not display proper API validation errors, and password recovery is not implemented.

## Goals / Non-Goals

**Goals:**
- Persist name details during email signups and display them consistently.
- Implement rate limiting based on the actual client IP (forwarded by proxy headers).
- Fix frontend login error parsing so specific error details are displayed.
- Implement a functional password reset flow using secure tokens sent via email.

**Non-Goals:**
- Creating complex profile settings editing screens (out of scope for this change).
- Multi-factor authentication setup.

## Decisions

### 1. Name/Username Persistence
- **Choice**: Store the custom registration `name` inside the existing JSONB `settings` field of the `User` table (as `settings["name"]`).
- **Rationale**: Avoids database DDL schema migration on the `User` table (keeping it light).
- **Implementation**:
  - Add `name: str | None = None` to `RegisterRequest` DTO.
  - During `register()`, populate the user settings: `settings = {"name": body.name} if body.name else {}`.
  - Update `get_me` in `auth.py` to retrieve `username` from `settings.get("name")` first.

### 2. Proxy-Aware Rate Limiting
- **Choice**: Implement a custom key function `get_proxy_client_ip` for SlowAPI.
- **Rationale**: Standard `get_remote_address` retrieves the gateway container's IP rather than the end user's IP.
- **Implementation**:
  - The custom function checks `X-Forwarded-For` or `X-Real-IP` header. If present, it extracts the first IP address. Otherwise, it falls back to `get_remote_address`.

### 3. Login Error Parsing
- **Choice**: Update `Login.tsx` to handle standard FastAPI error format (`detail` field).
- **Rationale**: FastAPI returns error details inside the `detail` object, whereas the frontend only checked `message`.

### 4. Password Recovery Flow
- **Choice**: Generate a secure UUID token on password reset request, store it in Redis (`pwd_reset:<token> -> email`) with a 15-minute TTL, and email the reset link to the user.
- **Rationale**: Redis provides automatic expiration, avoids adding columns to DB.
- **Implementation**:
  - Backend endpoints: `POST /auth/forgot-password` and `POST /auth/reset-password`.
  - Reuse the existing SMTP/email sender setup in `auth_service`.
  - Update the frontend `ForgotPass.tsx` component to handle request submission.

## Risks / Trade-offs

- **[Risk]**: Proxy IP headers can be spoofed if the Gateway doesn't strip external headers.
  - **Mitigation**: The API Gateway (FastAPI/Granian proxy layer) must overwrite the `X-Forwarded-For` header with the remote connection's IP.
- **[Risk]**: Redis connection failure could break password resets.
  - **Mitigation**: Standard Redis error handling with logging and friendly fallback warnings to the user.
