## 1. Backend Database and Model changes

- [x] 1.1 Add `telegram_id` field to `User` model in `services/auth_service/database/models.py`
- [x] 1.2 Generate new Alembic database migration for `telegram_id`
- [x] 1.3 Apply the Alembic migration on local/test database

## 2. Backend Auth Service route and signature verification

- [x] 2.1 Implement Telegram signature validation logic in a new utility or helper module in `services/auth_service`
- [x] 2.2 Create `TelegramAuthSchema` in `services/auth_service/shared/DTO.py`
- [x] 2.3 Add `POST /auth/telegram` route in `services/auth_service/routers/oauth.py` (or a dedicated route file)
- [x] 2.4 Handle user check/creation and JWT token generation inside the new route
- [x] 2.5 Write unit/integration tests for the `POST /auth/telegram` endpoint and signature verification

## 3. API Gateway updates

- [x] 3.1 Expose route for `POST /api/v1/auth/telegram` in `services/gateway/app/api/routes/auth.py`
- [x] 3.2 Add backend-allowed domain `https://smarket-7go.pages.dev` to `CORS_ORIGINS` in `services/gateway/app/main.py` if not already present

## 4. Frontend integration

- [x] 4.1 Create `TelegramLoginButton` React component in `apps/react/frontend/my-react-app/src/modules/Auth/components/TelegramLoginButton.tsx` (using absolute imports `@/`)
- [x] 4.2 Add Telegram API authentication function in `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts`
- [x] 4.3 Update auth Zustand store with login logic for Telegram
- [x] 4.4 Render the `TelegramLoginButton` next to the Google OAuth button on the auth page/modal
