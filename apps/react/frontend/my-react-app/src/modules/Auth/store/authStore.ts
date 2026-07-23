// src/modules/Auth/store/authStore.ts
import { create } from 'zustand';

export interface UserSettings {
  name?: string;
  phone?: string;
  city?: string;
  favorite_store?: string;
  photo_url?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
  photoUrl?: string;
  settings?: UserSettings;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (token: string, user: User) => void;
  finishInitialization: () => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const initialAuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialAuthState,
  isInitializing: true,

  // Access tokens and user PII intentionally live only in memory. The refresh
  // token remains in an HttpOnly cookie and restores the session after reload.
  setAuth: (token, user) => set({
    token,
    user,
    isAuthenticated: true,
    isInitializing: false,
  }),

  finishInitialization: () => set({ isInitializing: false }),

  logout: () => set({
    ...initialAuthState,
    isInitializing: false,
  }),

  updateUser: (updatedFields) => set((state) => ({
    user: state.user ? { ...state.user, ...updatedFields } : null,
  })),
}));
