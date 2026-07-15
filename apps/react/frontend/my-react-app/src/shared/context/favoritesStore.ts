import { create } from 'zustand';
import { apiClient } from '@/shared/api/apiClient';

export interface FavoriteItem {
  id: string;
  product_id: number;
  product_title: string | null;
  product_image_url: string | null;
  product_price: number | null;
  added_at: string;
}

interface FavoritesState {
  items: FavoriteItem[];
  isLoaded: boolean;
  isLoading: boolean;

  load: () => Promise<void>;
  add: (product: {
    product_id: number;
    product_title?: string;
    product_image_url?: string;
    product_price?: number;
  }) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  isLoaded: false,
  isLoading: false,

  load: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await apiClient.get<FavoriteItem[]>('/api/v1/favorites/');
      set({ items: res.data, isLoaded: true });
    } catch {
      // Silently fail (user may not be logged in)
    } finally {
      set({ isLoading: false });
    }
  },

  add: async (product) => {
    try {
      const res = await apiClient.post<FavoriteItem>('/api/v1/favorites/', product);
      set((state) => ({
        items: state.items.some((i) => i.product_id === product.product_id)
          ? state.items.map((i) => (i.product_id === product.product_id ? res.data : i))
          : [res.data, ...state.items],
      }));
    } catch (err) {
      console.error('Failed to add favorite:', err);
      throw err;
    }
  },

  remove: async (productId) => {
    // Optimistic update
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    }));
    try {
      await apiClient.delete(`/api/v1/favorites/${productId}`);
    } catch (err) {
      // Revert by reloading
      get().load();
    }
  },

  isFavorite: (productId) => {
    return get().items.some((i) => i.product_id === productId);
  },

  reset: () => set({ items: [], isLoaded: false }),
}));
