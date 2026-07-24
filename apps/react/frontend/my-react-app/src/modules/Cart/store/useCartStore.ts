import { create } from 'zustand';

interface CartStore {
  activeCartId: string | null;
  openMenuId: string | null;
  selectedStoreByCart: Record<string, string>;
  setActiveCart: (id: string | null) => void;
  setOpenMenuId: (id: string | null) => void;
  setSelectedStore: (cartId: string, storeId: string) => void;
  clearSelectedStore: (cartId: string) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  activeCartId: null,
  openMenuId: null,
  selectedStoreByCart: {},

  setActiveCart: (id) => set({ activeCartId: id }),
  setOpenMenuId: (id) => set({ openMenuId: id }),
  setSelectedStore: (cartId, storeId) =>
    set((state) => ({
      selectedStoreByCart: {
        ...state.selectedStoreByCart,
        [cartId]: storeId,
      },
    })),
  clearSelectedStore: (cartId) =>
    set((state) => {
      const selectedStoreByCart = { ...state.selectedStoreByCart };
      delete selectedStoreByCart[cartId];
      return { selectedStoreByCart };
    }),
}));
