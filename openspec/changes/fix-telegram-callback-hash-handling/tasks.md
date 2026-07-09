## 1. Fix TelegramCallbackPage to parse both hash and query params

- [x] 1.1 Rewrite `TelegramCallbackPage.tsx` to extract auth data from both `window.location.hash` and `window.location.search` using `URLSearchParams`, merging results with query string taking precedence
- [x] 1.2 Replace silent `window.location.replace('/auth')` with a visible error UI (centered error card) when auth data is missing from both hash and query params
- [x] 1.3 Add auto-redirect to `/auth` after 3-second delay when auth fails

## 2. Add error handling to useTelegramOAuth mutation

- [x] 2.1 Use `mutation.isError` and `mutation.error.message` in `TelegramCallbackPage` to display backend errors (e.g., 401 Invalid signature) as a visible error card
- [x] 2.2 Ensure the error card shows both: (a) hash/query parse failure, (b) backend error response

## 3. Verification

- [x] 3.1 Run TypeScript build (`tsc -b`) to check compilation
- [x] 3.2 Verify the callback page renders error UI instead of blank page when params are missing
