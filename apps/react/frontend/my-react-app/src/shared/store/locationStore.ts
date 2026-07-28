import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/shared/api/apiClient';

export interface CityItem {
  city: string;
  count: number;
}

interface LocationState {
  currentCity: string;
  availableCities: CityItem[];
  isLoadingCities: boolean;
  isDetectingLocation: boolean;
  setCity: (city: string) => void;
  fetchCities: () => Promise<void>;
  detectGeoLocation: () => Promise<string | null>;
}

const DEFAULT_CITY = 'Київ';

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentCity: DEFAULT_CITY,
      availableCities: [],
      isLoadingCities: false,
      isDetectingLocation: false,

      setCity: (city: string) => {
        if (!city || !city.trim()) return;
        const normalized = city.trim();
        set({ currentCity: normalized });

        // Синхронізація з профілем авторизованого користувача якщо доступно
        try {
          apiClient.patch('/api/v1/auth/me', {
            settings: { city: normalized }
          }).catch(() => {});
        } catch {}
      },

      fetchCities: async () => {
        set({ isLoadingCities: true });
        try {
          const { data } = await apiClient.get<CityItem[]>('/api/v1/stores/cities');
          if (Array.isArray(data) && data.length > 0) {
            set({ availableCities: data });
          } else {
            // Фолбек якщо сервер ще порожній
            set({
              availableCities: [
                { city: 'Київ', count: 15 },
                { city: 'Львів', count: 8 },
                { city: 'Одеса', count: 6 },
                { city: 'Дніпро', count: 5 },
                { city: 'Харків', count: 4 },
              ]
            });
          }
        } catch (e) {
          console.error('[locationStore] Failed to fetch cities', e);
          set({
            availableCities: [
              { city: 'Київ', count: 15 },
              { city: 'Львів', count: 8 },
              { city: 'Одеса', count: 6 },
              { city: 'Дніпро', count: 5 },
              { city: 'Харків', count: 4 },
            ]
          });
        } finally {
          set({ isLoadingCities: false });
        }
      },

      detectGeoLocation: async () => {
        if (!navigator.geolocation) {
          return null;
        }

        set({ isDetectingLocation: true });

        return new Promise<string | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                // Зворотний геокодинг за допомогою OpenStreetMap Nominatim
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=uk`
                );
                if (res.ok) {
                  const data = await res.json();
                  const detectedCity =
                    data.address?.city ||
                    data.address?.town ||
                    data.address?.village ||
                    data.address?.state ||
                    null;

                  if (detectedCity) {
                    get().setCity(detectedCity);
                    set({ isDetectingLocation: false });
                    resolve(detectedCity);
                    return;
                  }
                }
              } catch (err) {
                console.warn('[locationStore] Reverse geocoding failed', err);
              }
              set({ isDetectingLocation: false });
              resolve(null);
            },
            (error) => {
              console.warn('[locationStore] Geolocation error:', error.message);
              set({ isDetectingLocation: false });
              resolve(null);
            },
            { timeout: 8000 }
          );
        });
      },
    }),
    {
      name: 'smarket_user_city',
      partialize: (state) => ({ currentCity: state.currentCity }),
    }
  )
);
