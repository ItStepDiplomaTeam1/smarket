// src/modules/Auth/store/authStore.ts
import { create } from 'zustand';
import {persist} from 'zustand/middleware';

interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
  photoUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}


const initialAuthState = {
  token: null,
  user: null, isAuthenticated: false,
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}


export const useAuthStore = create<AuthState> () (
    persist(
        (set) => ({
          ...initialAuthState,

          setAuth: (token, user) => set({token, user, isAuthenticated: true}),

          logout: () => set(initialAuthState),
        }),
        {
          name: 'auth-storage',
          onRehydrateStorage: () => (state) => {
            if (state?.isAuthenticated && isTokenExpired(state.token)) {
              state.logout();
            }
          },
        }
    )
)