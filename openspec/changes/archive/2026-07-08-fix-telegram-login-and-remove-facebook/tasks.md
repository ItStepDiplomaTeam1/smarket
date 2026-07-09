## 1. Environment and Configuration

- [x] 1.1 Add `VITE_TELEGRAM_BOT_ID` to `apps/react/frontend/my-react-app/.env` and `.env.example`
- [x] 1.2 Document setup for production `TELEGRAM_BOT_TOKEN` in auth_service and gateway

## 2. Frontend Restructuring (Removing Facebook)

- [x] 2.1 Remove Facebook login button and unused import `btnfacebook` in `apps/react/frontend/my-react-app/src/modules/Auth/components/Create.tsx`
- [x] 2.2 Remove Facebook login button and unused import `btnfacebook` in `apps/react/frontend/my-react-app/src/modules/Auth/components/Popup.tsx`
- [x] 2.3 Remove Facebook login button and unused import `btnfacebook` in `apps/react/frontend/my-react-app/src/pages/Auth/index.tsx`

## 3. Custom Telegram Login Button Implementation

- [x] 3.1 Modify `TelegramLoginButton.tsx` to load `telegram-widget.js` globally once and render a custom HTML button matching Google button's styling
- [x] 3.2 Implement `handleTelegramLogin` in `TelegramLoginButton.tsx` using `window.Telegram.Login.auth`
- [x] 3.3 Update `TelegramLoginButton` instantiation in `Create.tsx` to pass the new `botId` prop instead of `botName`
- [x] 3.4 Update `TelegramLoginButton` instantiation in `Popup.tsx` to pass the new `botId` prop instead of `botName`
- [x] 3.5 Update `TelegramLoginButton` instantiation in `pages/Auth/index.tsx` to pass the new `botId` prop instead of `botName`

## 4. Verification and Testing

- [x] 4.1 Run frontend local build or linting checks to make sure TypeScript/React compiles successfully
- [x] 4.2 Run `auth_service` unit tests `pytest` to verify Telegram validation logic and automatic registration works locally
