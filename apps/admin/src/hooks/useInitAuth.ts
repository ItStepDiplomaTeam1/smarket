import { useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Runs once on application mount and attempts a silent token refresh.
 *
 * This is the key mechanism for "remembering" a logged-in admin across
 * page reloads: even though the access token is only stored in memory
 * (and is lost on F5), the HttpOnly cookie with the refresh_token
 * persists in the browser. On mount we silently call POST /auth/refresh;
 * if the cookie is valid we get a fresh access token and the user stays
 * logged-in without ever seeing the login page again.
 */
export function useInitAuth() {
  const { setToken, logout, setInitializing } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const silentRefresh = async () => {
      try {
        const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh');
        if (!cancelled) {
          setToken(data.access_token);
        }
      } catch {
        // No valid cookie → user is not authenticated. Clear any stale state.
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    silentRefresh();

    return () => {
      cancelled = true;
    };
  }, []); // runs once on mount
}
