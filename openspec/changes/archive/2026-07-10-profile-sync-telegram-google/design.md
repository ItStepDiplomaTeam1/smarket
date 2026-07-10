## Context

When users log in via Telegram or Google, their display username and avatar are not synchronized/passed to the Smarket frontend. Telegram logins store metadata in user `settings` JSONB but do not map it into display fields. Google logins do not store any profile metadata.

## Goals / Non-Goals

**Goals:**
- Extract name and avatar (picture) from Google OAuth credentials during login and save to user settings JSONB.
- Automatically map display name and photo URL from Telegram/Google settings on backend `/me` endpoint.
- Support rendering of user avatars on the frontend Header and profile Sidebar when available, with HSL initials as fallback.

**Non-Goals:**
- Do not perform PostgreSQL database DDL changes (no new columns in the `User` table; utilize the existing JSONB `settings` field).
- Do not support user-uploaded avatars (out of scope).

## Decisions

### 1. Store Google OAuth Name and Avatar in User `settings` JSONB
- **Approach**: Save `google_name`, `google_picture`, and `photo_url` in the user's `settings` dict upon Google login.
- **Rationale**: Reuses the existing flexible JSONB structure. Avoids database schema migrations.
- **Alternative considered**: Add `name` and `photo_url` columns to the `User` table. Rejected to avoid DDL/migration overhead.

### 2. Dynamically Resolve Display `username` and `photo_url` in `/me`
- **Approach**: The backend `/me` route will resolve the display `username` by checking `telegram_username` -> `telegram_first_name` -> `google_name` -> email prefix, and return the resolved `username` and `photo_url`.
- **Rationale**: Centralizes display logic in the backend, making the client simpler.

### 3. Frontend Avatar Render with HSL Initials Fallback
- **Approach**: Modify `Header.tsx` and `Sidebar.tsx` to conditionally display `<img src={user.photoUrl} />` inside the avatar circle. If `photoUrl` is missing, render initials as before.
- **Rationale**: Retains the existing UI aesthetic while enhancing it with real profile images.

## Risks / Trade-offs

- **Risk**: Google token doesn't include name or picture.
  - **Mitigation**: Fall back gracefully to email prefix and initials.
- **Risk**: Cache invalidation issues if profile details change.
  - **Mitigation**: Settings are fetched from the database on every `/me` call and updated on each successful OAuth login.
