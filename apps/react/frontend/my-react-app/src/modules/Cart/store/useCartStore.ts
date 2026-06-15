import { create } from 'zustand';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  name: string;
  updatedAt: string;
  items: CartItem[];
  bestStore: string;
  totalPrice: number;
  savings: number;
}

interface CartStore {
  carts: Cart[];
  activeCartId: string | null;
  openMenuId: string | null;
  setActiveCart: (id: string) => void;
  setOpenMenuId: (id: string | null) => void;
  deleteCart: (id: string) => void;
  updateCartItemQuantity: (cartId: string, itemId: string, quantity: number) => void;
  deleteCartItem: (cartId: string, itemId: string) => void;
  clearCart: (cartId: string) => void;
}

// Dummy data from mockups
const mockCarts: Cart[] = [
  {
    id: '1',
    name: 'Закупівля на тиждень',
    updatedAt: '2023-10-24T10:00:00Z',
    bestStore: 'АТБ',
    totalPrice: 1042,
    savings: 303,
    items: [
      {
        id: 'i1',
        title: 'Йогурт Галичина Карпатський без цукру 3.2% 350г',
        price: 25.50,
        quantity: 2,
      },
      {
        id: 'i2',
        title: 'Яблука Чемпіон Україна, 1 кг',
        price: 32.00,
        quantity: 1,
      },
      {
        id: 'i3',
        title: 'Хліб Київхліб Український столичний 950г',
        price: 28.00,
        quantity: 1,
      },
      {
        id: 'i4',
        title: 'Молоко Яготинське 2.6% 900г плівка',
        price: 36.50,
        quantity: 3,
      },
      {
        id: 'i5',
        title: 'Яйця курячі Ясенсвіт С1 10шт',
        price: 65.00,
        quantity: 2,
      },
      {
        id: 'i6',
        title: 'Сир Комо Тенеро 50% 160г',
        price: 85.00,
        quantity: 1,
      }
    ]
  },
  {
    id: '2',
    name: 'Для вечірки',
    updatedAt: '2023-10-23T15:30:00Z',
    bestStore: 'Сільпо',
    totalPrice: 1560,
    savings: 120,
    items: []
  },
  {
    id: '3',
    name: 'Інгредієнти для борщу',
    updatedAt: '2023-10-20T12:00:00Z',
    bestStore: 'Novus',
    totalPrice: 245,
    savings: 45,
    items: []
  }
];

export const useCartStore = create<CartStore>((set) => ({
  carts: mockCarts,
  activeCartId: '1',
  openMenuId: null,

  setActiveCart: (id) => set({ activeCartId: id }),

  setOpenMenuId: (id) => set({ openMenuId: id }),

  deleteCart: (id) => set((state) => ({
    carts: state.carts.filter(cart => cart.id !== id),
    activeCartId: state.activeCartId === id 
      ? (state.carts.filter(c => c.id !== id)[0]?.id || null) 
      : state.activeCartId,
    openMenuId: null
  })),

  updateCartItemQuantity: (cartId, itemId, quantity) => set((state) => ({
    carts: state.carts.map(cart => 
      cart.id === cartId 
        ? {
            ...cart,
            items: cart.items.map(item => 
              item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
            )
          }
        : cart
    )
  })),

  deleteCartItem: (cartId, itemId) => set((state) => ({
    carts: state.carts.map(cart => 
      cart.id === cartId 
        ? { ...cart, items: cart.items.filter(item => item.id !== itemId) }
        : cart
    )
  })),

  clearCart: (cartId) => set((state) => ({
    carts: state.carts.map(cart => 
      cart.id === cartId ? { ...cart, items: [] } : cart
    )
  }))
}));
