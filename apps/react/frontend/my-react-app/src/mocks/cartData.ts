// Загальна інформація про магазин у порівнянні
export interface StoreComparison {
  storeName: string;
  totalPrice: number;
  isBest: boolean;
}

// Підсумок конкретного кошика
export interface CartSummary {
  totalItems: number;
  maxPossibleSavings: number;
  comparison: StoreComparison[];
}

// Елемент списку кошиків (для 1-ї колонки)
export interface CartListItem {
  id: string;
  title: string;
  itemsCount: number;
  bestStore: string;
  bestPrice: number;
  potentialSavings: number;
  updatedAt: string;
}

// Деталі конкретного товару в кошику
export interface CartItemDetail {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  basePrice: number;
  totalItemPrice: number;
}

// Повна відповідь для конкретного кошика (для 2-ї та 3-ї колонок)
export interface CartDetailResponse extends CartListItem {
  items: CartItemDetail[];
  summary: CartSummary;
}

export const mockCartsList: CartListItem[] = [
  {
    id: '1',
    title: 'Закупівля на тиждень',
    itemsCount: 6,
    bestStore: 'АТБ',
    bestPrice: 1042,
    potentialSavings: 303,
    updatedAt: '2023-10-24T10:00:00Z',
  },
  {
    id: '2',
    title: 'Для вечірки',
    itemsCount: 0,
    bestStore: 'Сільпо',
    bestPrice: 1560,
    potentialSavings: 120,
    updatedAt: '2023-10-23T15:30:00Z',
  },
  {
    id: '3',
    title: 'Інгредієнти для борщу',
    itemsCount: 0,
    bestStore: 'Novus',
    bestPrice: 245,
    potentialSavings: 45,
    updatedAt: '2023-10-20T12:00:00Z',
  }
];

export const mockCartDetails: Record<string, CartDetailResponse> = {
  '1': {
    ...mockCartsList[0],
    items: [
      {
        id: 'i1',
        productId: 'i1',
        name: 'Йогурт Галичина Карпатський без цукру 3.2% 350г',
        basePrice: 25.50,
        quantity: 2,
        totalItemPrice: 51.00,
      },
      {
        id: 'i2',
        productId: 'i2',
        name: 'Яблука Чемпіон Україна, 1 кг',
        basePrice: 32.00,
        quantity: 1,
        totalItemPrice: 32.00,
      },
      {
        id: 'i3',
        productId: 'i3',
        name: 'Хліб Київхліб Український столичний 950г',
        basePrice: 28.00,
        quantity: 1,
        totalItemPrice: 28.00,
      },
      {
        id: 'i4',
        productId: 'i4',
        name: 'Молоко Яготинське 2.6% 900г плівка',
        basePrice: 36.50,
        quantity: 3,
        totalItemPrice: 109.50,
      },
      {
        id: 'i5',
        productId: 'i5',
        name: 'Яйця курячі Ясенсвіт С1 10шт',
        basePrice: 65.00,
        quantity: 2,
        totalItemPrice: 130.00,
      },
      {
        id: 'i6',
        productId: 'i6',
        name: 'Сир Комо Тенеро 50% 160г',
        basePrice: 85.00,
        quantity: 1,
        totalItemPrice: 85.00,
      }
    ],
    summary: {
      totalItems: 6,
      maxPossibleSavings: 303,
      comparison: [
        { storeName: 'АТБ', totalPrice: 1042, isBest: true },
        { storeName: 'Сільпо', totalPrice: 1345, isBest: false },
        { storeName: 'Novus', totalPrice: 1237, isBest: false },
      ]
    }
  },
  '2': {
    ...mockCartsList[1],
    items: [],
    summary: {
      totalItems: 0,
      maxPossibleSavings: 120,
      comparison: [
        { storeName: 'Сільпо', totalPrice: 1560, isBest: true },
        { storeName: 'Novus', totalPrice: 1680, isBest: false },
      ]
    }
  },
  '3': {
    ...mockCartsList[2],
    items: [],
    summary: {
      totalItems: 0,
      maxPossibleSavings: 45,
      comparison: [
        { storeName: 'Novus', totalPrice: 245, isBest: true },
        { storeName: 'АТБ', totalPrice: 290, isBest: false },
      ]
    }
  }
};
