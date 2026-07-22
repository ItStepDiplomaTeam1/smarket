import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const normalizeTheme = (theme: unknown): Theme => theme === 'dark' ? 'dark' : 'light';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: normalizeTheme(getCookie('theme')),
      setTheme: (theme) => {
        setCookie('theme', theme, 365);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      merge: (persistedState, currentState) => {
        const persistedTheme = (persistedState as { theme?: unknown } | null)?.theme;

        return {
          ...currentState,
          theme: persistedTheme === undefined
            ? currentState.theme
            : normalizeTheme(persistedTheme),
        };
      },
    }
  )
);

