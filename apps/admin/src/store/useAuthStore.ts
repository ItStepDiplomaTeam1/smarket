import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  user: any | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => {
        try {
          const decoded = jwtDecode(token);
          set({ token, user: decoded });
        } catch (error) {
          console.error('Invalid token', error);
          set({ token: null, user: null });
        }
      },
      logout: () => set({ token: null, user: null }),
      isAdmin: () => {
        const { user } = get();
        // Assuming your JWT payload has a 'role' or 'roles' property
        return user?.role === 'admin' || user?.roles?.includes('admin');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
