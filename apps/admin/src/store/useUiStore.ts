import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isDarkMode: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleTheme: () => set((state) => {
        const next = !state.isDarkMode;
        console.log('[useUiStore] toggleTheme called. Next isDarkMode:', next);
        return { isDarkMode: next };
      }),
      setTheme: (isDark) => set(() => {
        console.log('[useUiStore] setTheme called. Value:', isDark);
        return { isDarkMode: isDark };
      }),
    }),
    {
      name: 'admin-ui-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
