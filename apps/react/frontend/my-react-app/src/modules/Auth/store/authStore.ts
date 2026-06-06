// src/modules/Auth/store/authStore.ts
import { create } from 'zustand';

interface User {
  id: string;
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

// Створюємо хук-стор. Зверни увагу: жодних провайдерів не потрібно!
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  
  // Екшен для збереження даних при успішному вході
  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
  
  // Екшен для виходу з системи
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}));