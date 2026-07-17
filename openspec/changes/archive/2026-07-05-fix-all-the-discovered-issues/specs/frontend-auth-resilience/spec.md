## ADDED Requirements

### Requirement: Frontend logout calls server endpoint
The frontend SHALL call `POST /api/v1/auth/logout` (with `withCredentials: true`) before clearing local auth state. The local state (Zustand store) SHALL be cleared regardless of whether the server call succeeds or fails.

#### Scenario: Logout succeeds
- **WHEN** the user clicks "Logout" and the server returns 204
- **THEN** the Zustand auth store is cleared, the user is redirected to `/`, and the refresh_token cookie is deleted by the server

#### Scenario: Logout fails due to network error
- **WHEN** the user clicks "Logout" and the server call fails (network error, timeout)
- **THEN** the Zustand auth store is still cleared, the user is redirected to `/`

### Requirement: Stale token cleanup on page reload
When the Zustand store is rehydrated from localStorage on page reload, the frontend SHALL check if the persisted access token is expired. If expired, the frontend SHALL immediately clear the store (set `isAuthenticated: false`, `token: null`, `user: null`) instead of showing a flash of authenticated state.

#### Scenario: Reload with expired access token
- **WHEN** the page is reloaded and the persisted access token's `exp` is in the past
- **THEN** the auth store is immediately reset to unauthenticated state without making any API calls

#### Scenario: Reload with valid access token
- **WHEN** the page is reloaded and the persisted access token's `exp` is in the future
- **THEN** the auth store is rehydrated normally and `useFetchMe` fetches fresh user data
