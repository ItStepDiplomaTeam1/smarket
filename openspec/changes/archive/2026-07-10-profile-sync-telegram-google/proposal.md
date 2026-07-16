## Why

Currently, when users register/login via Telegram or Google OAuth, their profile nickname and avatar are either not synced or not displayed on the Smarket frontend platform. Having a personalized name and avatar improves user experience, customization, and engagement.

## What Changes

- Save Google User's name and picture (avatar) in the user's `settings` JSONB field during login/registration.
- Update `/me` endpoint to dynamically resolve user's display `username` and `photo_url` from Telegram/Google OAuth metadata stored in settings.
- Return `settings` field for the user object in Google OAuth login response.
- Update the React frontend `Header` and profile `Sidebar` to render the user's avatar image if a `photoUrl` is present, falling back to HSL-colored initials.
- Update frontend store (`authStore.ts`) and API layer (`useAuthApi.ts`) to manage and persist `photoUrl` alongside name and email.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `telegram-auth`: Sync and return Telegram username and photo URL to display in user profile and header.
- `google-auth`: Sync and return Google name and picture URL to display in user profile and header.

## Impact

- `services/auth_service/routers/oauth.py`: Google and Telegram login response updates, saving/updating name and picture.
- `services/auth_service/routers/auth.py`: `/me` response format changes (adding `photo_url`, mapping `username`).
- `apps/react/frontend/my-react-app/src/modules/Auth/store/authStore.ts`: Interface updates for user.
- `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts`: OAuth user mappings and `/me` query mappings.
- `apps/react/frontend/my-react-app/src/shared/ui/Header/Header.tsx`: Profile avatar rendering logic.
- `apps/react/frontend/my-react-app/src/modules/Profile/components/Sidebar.tsx`: Profile sidebar avatar rendering logic.
