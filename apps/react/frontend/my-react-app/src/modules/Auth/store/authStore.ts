// src/modules/Auth/store/authStore.ts
import { create } from 'zustand';
import {persist} from 'zustand/middleware';

interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
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


export const useAuthStore = create<AuthState> () (
    persist(
        (set) => ({
          ...initialAuthState,

          setAuth: (token, user) => set({token, user, isAuthenticated: true}),

          logout: () => set(initialAuthState),
        }), {name: 'auth-storage'}
    )
)