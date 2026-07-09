## Why

The Telegram OAuth redirect flow silently fails when Telegram returns auth data in the URL hash fragment (`#`) instead of the query string (`?`). The `TelegramCallbackPage` only reads from `useSearchParams()`, so when data arrives in the hash, the callback silently redirects to `/auth` with no error. The production `TELEGRAM_BOT_TOKEN` was also set to a dummy value, causing HMAC validation to fail with 401 — this is already fixed, but the hash handling bug remains.

## What Changes

- Fix `TelegramCallbackPage.tsx` to read auth data from BOTH `window.location.hash` and `window.location.search`, matching the design spec from `fix-telegram-redirect-auth`
- Add robust error handling: show a user-visible error message on the callback page instead of silently redirecting to `/auth`
- Add `onError` handling to `useTelegramOAuth` mutation so backend errors surface to the user

## Capabilities

### New Capabilities

*(none — this is a bugfix for existing capability)*

### Modified Capabilities

- `telegram-auth-callback`: add requirement that the callback page MUST parse auth data from both URL hash fragment and query string before falling back to error redirect. Add requirement that errors MUST be surfaced to the user.

## Impact

- `apps/react/frontend/my-react-app/src/pages/TelegramCallback/ui/TelegramCallbackPage.tsx` — core fix
- `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts` — add error handling to `useTelegramOAuth` mutation
- No backend changes needed
- No spec or DB changes
