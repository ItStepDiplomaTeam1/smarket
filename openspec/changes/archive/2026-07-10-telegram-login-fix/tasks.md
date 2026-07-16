## 1. Frontend Configuration Update

- [x] 1.1 Update `VITE_TELEGRAM_BOT_ID` to `8912413936` in `apps/react/frontend/my-react-app/.env` and `apps/react/frontend/my-react-app/.env.example`
- [x] 1.2 Update the fallback `botId` from `'7243912952'` to `'8912413936'` in `Create.tsx`, `Popup.tsx`, and `pages/Auth/index.tsx`

## 2. Frontend Callback Base64URL Decoding

- [x] 2.1 Modify `getTelegramParams` in `TelegramCallbackPage.tsx` to detect `tgAuthResult` from hash or search parameters
- [x] 2.2 Implement Base64URL decoding, JSON parsing, and parameter merging for `tgAuthResult` in `getTelegramParams`

## 3. Verification and Testing

- [x] 3.1 Run frontend build command to verify there are no TypeScript or compilation errors
