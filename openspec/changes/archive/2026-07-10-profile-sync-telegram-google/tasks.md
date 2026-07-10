## 1. Backend Authentication Service Changes

- [x] 1.1 Update `oauth_google_login` in `services/auth_service/routers/oauth.py` to extract Google user name and picture URL from claims and save/update them in the user `settings` JSONB field.
- [x] 1.2 Include the `settings` parameter in `UserResponse` for `oauth_google_login` response to return the JSONB settings dict to the frontend.
- [x] 1.3 Update the `/me` (`get_me`) endpoint in `services/auth_service/routers/auth.py` to resolve and return dynamic `username` (from Telegram username/first_name, or Google name) and `photo_url` (from settings).

## 2. Frontend React Client Changes

- [x] 2.1 Update the `User` interface in `apps/react/frontend/my-react-app/src/modules/Auth/store/authStore.ts` to include an optional `photoUrl?: string`.
- [x] 2.2 Update `OAuthUser` and `MeResponse` interfaces in `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts` to support settings and `photo_url`.
- [x] 2.3 Update onSuccess callback hooks for Google and Telegram OAuth in `useAuthApi.ts` to correctly map `photo_url`/`settings.photo_url` into the auth store user profile details.
- [x] 2.4 Update `apps/react/frontend/my-react-app/src/shared/ui/Header/Header.tsx` to display the user avatar image when `user.photoUrl` is present.
- [x] 2.5 Update `apps/react/frontend/my-react-app/src/modules/Profile/components/Sidebar.tsx` to display the user avatar image when `user.photoUrl` is present.

## 3. Verification

- [x] 3.1 Verify backend code formatting with Ruff/Linter checks.
- [x] 3.2 Verify frontend build passes without TypeScript errors.
