import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  role: string;
  email: string;
  exp: number;
  type: string;
}

interface UserInfo {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  /** Access token — lives ONLY in memory, never persisted to localStorage. */
  token: string | null;
  /** Decoded user info from the JWT payload. */
  user: UserInfo | null;
  /** True while a silent refresh request is in-flight on app boot. */
  isInitializing: boolean;

  /** Called after a successful login or token refresh. */
  setToken: (token: string) => void;
  /** Called to clear auth state (logout or refresh failure). */
  logout: () => void;
  /** Set during the initial silent-refresh check. */
  setInitializing: (value: boolean) => void;
  /** Convenience check used by ProtectedRoute. */
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  isInitializing: true, // true until we know if the cookie is still valid

  setToken: (token) => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      set({
        token,
        user: {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        },
      });
    } catch (error) {
      console.error('[useAuthStore] Failed to decode token', error);
      set({ token: null, user: null });
    }
  },

  logout: () => set({ token: null, user: null }),

  setInitializing: (value) => set({ isInitializing: value }),

  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin' || user?.role === 'superadmin';
  },
}));
