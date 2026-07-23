import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore, type UserSettings } from '@/modules/Auth/store/authStore';

interface RefreshResponse {
  access_token: string;
}

interface MeResponse {
  id: string;
  email: string;
  username: string;
  role?: string;
  photo_url?: string;
  settings?: UserSettings;
}

let initializationPromise: Promise<void> | null = null;

const removeLegacySensitiveStorage = () => {
  try {
    localStorage.removeItem('auth-storage');
    const legacyKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('smarket_user_')) {
        legacyKeys.push(key);
      }
    }
    legacyKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in privacy mode; session restoration still works.
  }
};

const initializeAuth = (): Promise<void> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    removeLegacySensitiveStorage();
    try {
      const { data: refresh } = await apiClient.post<RefreshResponse>('/api/v1/auth/refresh');
      useAuthStore.setState({ token: refresh.access_token });

      const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
      useAuthStore.getState().setAuth(refresh.access_token, {
        id: me.id,
        email: me.email,
        name: me.username,
        role: me.role,
        photoUrl: me.photo_url,
        settings: me.settings,
      });
    } catch {
      useAuthStore.getState().logout();
    } finally {
      useAuthStore.getState().finishInitialization();
    }
  })();

  return initializationPromise;
};

export const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const isInitializing = useAuthStore((state) => state.isInitializing);

  useEffect(() => {
    void initializeAuth();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#111A17]">
        <Loader2 className="h-8 w-8 animate-spin text-[#265447] dark:text-[#3DAE8B]" aria-label="Відновлення сесії" />
      </div>
    );
  }

  return children;
};
