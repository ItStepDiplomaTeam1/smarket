import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { getCityDisplayName, getCityFilterValue } from '@/shared/utils/city';

export interface CityItem {
  city: string;
  count: number;
}

interface LocationState {
  currentCity: string;
  isCityFilterEnabled: boolean;
  availableCities: CityItem[];
  isLoadingCities: boolean;
  isDetectingLocation: boolean;
  setCity: (city: string) => void;
  setCityFilterEnabled: (enabled: boolean) => void;
  fetchCities: () => Promise<void>;
  detectGeoLocation: () => Promise<string | null>;
}

const DEFAULT_CITY = 'Київ';
const FALLBACK_CITIES = ['kiev', 'lviv', 'odesa', 'dnipro', 'kharkiv'].map((city) => ({
  city: getCityDisplayName(city),
  count: 0,
}));

interface StoreCitySource {
  city?: string | null;
}

const prepareCities = (items: CityItem[]): CityItem[] => {
  const citiesByValue = new Map<string, CityItem>();

  for (const item of items) {
    const value = getCityFilterValue(item.city);
    if (!value) continue;

    const previous = citiesByValue.get(value);
    citiesByValue.set(value, {
      city: getCityDisplayName(item.city),
      count: (previous?.count ?? 0) + item.count,
    });
  }

  return Array.from(citiesByValue.values()).sort(
    (left, right) => right.count - left.count || left.city.localeCompare(right.city, 'uk'),
  );
};

const fetchCitiesFromStores = async (): Promise<CityItem[]> => {
  const { data } = await apiClient.get<StoreCitySource[]>('/api/v1/stores/', {
    params: { is_active: true, limit: 1000 },
  });
  const counts = new Map<string, number>();

  for (const store of data) {
    const city = store.city?.trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  return prepareCities(
    Array.from(counts, ([city, count]) => ({ city, count })),
  );
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentCity: DEFAULT_CITY,
      isCityFilterEnabled: false,
      availableCities: [],
      isLoadingCities: false,
      isDetectingLocation: false,

      setCity: (city: string) => {
        if (!city || !city.trim()) return;
        const normalized = getCityDisplayName(city);
        set({ currentCity: normalized, isCityFilterEnabled: true });

        // Синхронізація з профілем доступна лише після відновлення сесії.
        if (useAuthStore.getState().isAuthenticated) {
          apiClient.patch('/api/v1/auth/me', {
            settings: { city: normalized }
          }).catch(() => {
            // The local preference remains valid when the optional profile sync is unavailable.
          });
        }
      },

      setCityFilterEnabled: (enabled: boolean) => {
        set({ isCityFilterEnabled: enabled });
      },

      fetchCities: async () => {
        const { availableCities, isLoadingCities } = get();
        if (isLoadingCities || availableCities.length > 0) return;

        set({ isLoadingCities: true });
        try {
          const cities = await fetchCitiesFromStores();
          set({ availableCities: cities.length > 0 ? cities : FALLBACK_CITIES });
        } catch (error) {
          console.warn('[locationStore] Failed to derive cities from stores', error);
          set({ availableCities: FALLBACK_CITIES });
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
      partialize: (state) => ({
        currentCity: state.currentCity,
        isCityFilterEnabled: state.isCityFilterEnabled,
      }),
    }
  )
);
