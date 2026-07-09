## Context

The current Telegram Login Widget integration relies on embedding an iframe. Due to React component updates, the script is clean-rendered when the mutation pending state changes. This drops user interaction/activation context, leading to browser security (Fingerprinting protection and popup blocker) blocking the authentication popup. Furthermore, the backend fails signature verification on the deployed site due to an unconfigured/dummy `TELEGRAM_BOT_TOKEN`. Finally, the Facebook login is unused and needs to be deleted, and the Telegram button needs to look exactly like the Google login button.

## Goals / Non-Goals

**Goals:**
- Replace the iframe-based Telegram login widget with a custom HTML button matching the styling of "Continue with Google".
- Programmatically trigger the Telegram login popup using `window.Telegram.Login.auth` on button click, preserving direct user activation.
- Remove all Facebook login buttons and related assets.
- Configure `VITE_TELEGRAM_BOT_ID` in the frontend environment for targeting the bot.
- Ensure the backend correctly logs in existing users and automatically registers new users (which it already does structurally).

**Non-Goals:**
- Refactoring the entire auth_service database or changing how user profiles are stored.
- Adding phone number verification or additional OAuth providers.

## Decisions

### 1. Programmatic Telegram Auth with JavaScript SDK
- **Problem**: Iframe-based widget is blocked by browsers because of dynamic component updates and lack of direct click activation.
- **Solution**: Load `telegram-widget.js` globally once, and use `window.Telegram.Login.auth({ bot_id: VITE_TELEGRAM_BOT_ID, request_access: 'write' }, callback)` inside the React button's `onClick` handler.
- **Aesthetic**: Style the custom button with Tailwind classes to match Google's login/register button (white bg, borders, font-semibold, hover transitions, size/height).

### 2. Frontend Environment Configuration
- **Decision**: Define `VITE_TELEGRAM_BOT_ID` in `.env` and `.env.example`. This is the numeric prefix of the bot token and is public knowledge, safe for the frontend client.

### 3. Removal of Facebook Integration
- **Decision**: Remove Facebook buttons from `Create.tsx`, `Popup.tsx`, and `pages/Auth/index.tsx`. Remove the `btnfacebook` import.

### 4. Automatic Login/Registration logic
- **Decision**: No changes to backend database schemas or `/auth/oauth/telegram` endpoint, as it already supports registration for new `telegram_id`s with placeholder emails `tg_<telegram_id>@smarket.local` and simple login for existing ones. We will verify this endpoint behavior in tests.

## Risks / Trade-offs

- **[Risk]** The Telegram script fails to load or load is delayed.
  - **Mitigation**: Handle the fallback check `!(window as any).Telegram?.Login` in the click handler and log an error or disable the button until loaded.
- **[Risk]** Incorrect `TELEGRAM_BOT_TOKEN` on production server.
  - **Mitigation**: Explicitly document that the production server environment variable `TELEGRAM_BOT_TOKEN` must match the bot whose ID is specified in `VITE_TELEGRAM_BOT_ID`.
