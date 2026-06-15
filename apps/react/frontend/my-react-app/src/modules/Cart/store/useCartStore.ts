import { create } from 'zustand';

interface CartStore {
  activeCartId: string | null;
  openMenuId: string | null;
  setActiveCart: (id: string | null) => void;
  setOpenMenuId: (id: string | null) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  activeCartId: '1', // Default to first cart for mockup purposes
  openMenuId: null,

  setActiveCart: (id) => set({ activeCartId: id }),
  setOpenMenuId: (id) => set({ openMenuId: id }),
}));
