## Context

The Telegram OAuth redirect flow (implemented in `fix-telegram-redirect-auth`) was designed to replace the popup-based SDK with a full-page redirect. The design specified that the callback page MUST parse auth data from BOTH `window.location.hash` and `window.location.search`. However, the implementation only reads from `useSearchParams()` (query string `?`), ignoring the URL hash fragment (`#`).

The existing spec (`telegram-auth-callback`) already mentions "URL hash" in the success scenario, so the requirement exists — the implementation simply doesn't fulfill it.

Separately, the `useTelegramOAuth` mutation has no `onError` handler, so backend errors (like HMAC validation failure with wrong `TELEGRAM_BOT_TOKEN`) are silently swallowed.

## Goals / Non-Goals

**Goals:**
- `TelegramCallbackPage` successfully extracts Telegram auth data regardless of whether Telegram returns it in URL hash (`#`) or query string (`?`)
- User sees a meaningful error message on the callback page when auth fails, instead of silently redirecting to `/auth`
- `useTelegramOAuth` mutation surfaces backend errors to the UI

**Non-Goals:**
- No backend changes (HMAC validation, user creation, JWT issuance are unchanged)
- No changes to the Telegram login button or the redirect URL generation
- No changes to routing or Cloudflare Pages configuration

## Decisions

### 1. Parse both `location.hash` and `location.search`
- **Problem**: `useSearchParams()` only reads from the query string. Telegram may return auth data in the hash fragment.
- **Solution**: Read raw params from `window.location.hash` (strip `#`, parse as query string) AND `window.location.search` (query string). Merge both, with query string taking precedence if overlap.
- **Why not useSearchParams alone**: It has no access to the hash fragment. React Router doesn't expose hash params natively.
- **Why not switch to hash router**: Over-engineering for a single page. The raw approach is simpler.

### 2. Show inline error on callback page, don't redirect silently
- **Problem**: Currently, missing params cause `window.location.replace('/auth')` with no error feedback.
- **Solution**: Show a centered error card on the callback page with the error message. Auto-redirect to `/auth` after a short delay (e.g., 3 seconds). Use `useTelegramOAuth`'s `isError` / `error.message` for backend errors.

### 3. Add `onError` to `useTelegramOAuth` mutation
- **Problem**: Backend 401 errors are caught but re-thrown, with no UI feedback.
- **Solution**: The mutation already catches errors and re-throws them. The callback page will use `mutation.isError` and `mutation.error.message` to display errors.

## Risks / Trade-offs

- **[Risk]** Telegram changes the return format again.
  - **Mitigation**: The dual-parse approach handles both current known formats. If Telegram adds a third format, the error will be visible (not silent) so it's debuggable.
- **[Risk]** `photo_url` in hash may contain special characters that break simple query-string parsing.
  - **Mitigation**: Use `URLSearchParams` for parsing both hash and search, which handles encoding correctly.
