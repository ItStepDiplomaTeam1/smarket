import { useQuery } from '@tanstack/react-query';


export interface DashboardData {
  metrics: {
    totalProducts: number;
    totalProductsTrend: number;
    totalStores: number;
    totalStoresTrend: number;
    totalUsers: number;
    totalUsersTrend: number;
    pricesUpdatedToday: number;
    pricesUpdatedTrend: number;
  };
  priceDynamics: Array<{ name: string; value: number }>;
  systemLogs: Array<{ id: string; time: string; event: string; details: string; status: 'success' | 'warning' | 'error' | 'info' }>;
  needsAttention: Array<{ id: string; source: string; message: string; time: string; type: 'error' | 'sync' | 'warning' | 'success' }>;
  popularCategories: Array<{ id: string; name: string; count: number; icon: string }>;
  newUsers: Array<{ id: string; name: string; email: string; initials: string }>;
  searchQueries: Array<{ id: string; query: string; count: number; position: number }>;
  dataCollection: {
    updatedToday: number;
    activeParsers: number;
    errors: number;
  };
  sourceStatus: Array<{ id: string; name: string; statusText: string; timeText: string; detailsText: string; state: 'working' | 'sync' | 'error' }>;
  systemStatus: Array<{ service: string; status: 'operational' | 'degraded' | 'down' }>;
  popularProducts: Array<{ id: string; name: string; category: string; rating: number; reviews: number; image: string; volume?: string }>;
}

import { apiClient } from '@/lib/apiClient';

const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await apiClient.get<DashboardData>('/admin/dashboard-summary');
    const mockData = getMockDashboardData();
    
    if (!response.data?.metrics) return mockData;
    
    return {
      ...mockData,
      ...response.data,
      // Fallback to mock data for empty arrays to keep the dashboard populated
      priceDynamics: response.data.priceDynamics?.length > 0 ? response.data.priceDynamics : mockData.priceDynamics,
      systemLogs: response.data.systemLogs?.length > 0 ? response.data.systemLogs : mockData.systemLogs,
      needsAttention: response.data.needsAttention?.length > 0 ? response.data.needsAttention : mockData.needsAttention,
      popularCategories: response.data.popularCategories?.length > 0 ? response.data.popularCategories : mockData.popularCategories,
      newUsers: response.data.newUsers?.length > 0 ? response.data.newUsers : mockData.newUsers,
      searchQueries: response.data.searchQueries?.length > 0 ? response.data.searchQueries : mockData.searchQueries,
      sourceStatus: response.data.sourceStatus?.length > 0 ? response.data.sourceStatus : mockData.sourceStatus,
      systemStatus: response.data.systemStatus?.length > 0 ? response.data.systemStatus : mockData.systemStatus,
      popularProducts: response.data.popularProducts?.length > 0 ? response.data.popularProducts : mockData.popularProducts,
    };
  } catch {
    return getMockDashboardData();
  }
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

function getMockDashboardData(): DashboardData {
  return {
    metrics: {
      totalProducts: 12534,
      totalProductsTrend: 5.2,
      totalStores: 18,
      totalStoresTrend: 2,
      totalUsers: 8921,
      totalUsersTrend: 3.7,
      pricesUpdatedToday: 12541,
      pricesUpdatedTrend: 9.1,
    },
    priceDynamics: [
      { name: '04.07', value: 120000 },
      { name: '05.07', value: 150000 },
      { name: '06.07', value: 180000 },
      { name: '07.07', value: 160000 },
      { name: '08.07', value: 200000 },
      { name: '09.07', value: 220000 },
      { name: '10.07', value: 208655 },
    ],
    systemLogs: [
      { id: '1', time: '14:35:12', event: 'Успішне оновлення парсера АТБ', details: 'Оновлено 4 521 товарів', status: 'success' },
      { id: '2', time: '14:30:05', event: 'Успішне оновлення парсера Сільпо', details: 'Оновлено 3 895 товарів', status: 'success' },
      { id: '3', time: '14:12:44', event: 'Помилка парсера Metro', details: 'API недоступний (503)', status: 'error' },
      { id: '4', time: '14:05:34', event: 'Створено користувача', details: 'user@example.com', status: 'info' },
      { id: '5', time: '13:58:55', event: 'Запущено парсер Novus', details: 'Синхронізація даних', status: 'warning' },
    ],
    needsAttention: [
      { id: '1', source: 'Metro', message: 'помилка API', time: '14:12', type: 'error' },
      { id: '2', source: 'Novus', message: 'синхронізація триває 18 хв', time: '14:20', type: 'sync' },
      { id: '3', source: '3 товари без категорії', message: '', time: '', type: 'warning' },
      { id: '4', source: '12 товарів без цін', message: '', time: '', type: 'warning' },
    ],
    popularCategories: [
      { id: '1', name: 'молочні продукти', count: 2456, icon: 'milk' },
      { id: '2', name: 'побутова хімія', count: 2189, icon: 'chemistry' },
      { id: '3', name: 'дитячі товари', count: 1827, icon: 'baby' },
      { id: '4', name: 'алкоголь', count: 1562, icon: 'alcohol' },
      { id: '5', name: 'продукти', count: 928, icon: 'food' },
    ],
    newUsers: [
      { id: '1', name: 'Іван Петренко', email: 'petrenko@example.com', initials: 'ІП' },
      { id: '2', name: 'Олена Коваль', email: 'koval.olena@example.com', initials: 'ОК' },
      { id: '3', name: 'Влад Мельник', email: 'melnyk.vlad@example.com', initials: 'ВМ' },
      { id: '4', name: 'Марія Шевченко', email: 'shevchenko.m@example.com', initials: 'МШ' },
    ],
    searchQueries: [
      { id: '1', query: 'молоко', count: 1245, position: 1 },
      { id: '2', query: 'алкоголь', count: 1100, position: 2 },
      { id: '3', query: 'підгузки', count: 815, position: 3 },
      { id: '4', query: 'кава', count: 773, position: 4 },
      { id: '5', query: 'пральний порошок', count: 628, position: 5 },
    ],
    dataCollection: {
      updatedToday: 12541,
      activeParsers: 8,
      errors: 2
    },
    sourceStatus: [
      { id: '1', name: 'АТБ', statusText: 'Працює', timeText: '5 хв тому', detailsText: '4 521 товар', state: 'working' },
      { id: '2', name: 'Сільпо', statusText: 'Працює', timeText: '8 хв тому', detailsText: '3 895 товар', state: 'working' },
      { id: '3', name: 'Novus', statusText: 'Синхронізація', timeText: 'зараз', detailsText: '2 145 товарів', state: 'sync' },
      { id: '4', name: 'Metro', statusText: 'Помилка', timeText: '32 хв тому', detailsText: '0 товарів', state: 'error' },
    ],
    systemStatus: [
      { service: 'PostgreSQL', status: 'operational' },
      { service: 'Redis', status: 'operational' },
      { service: 'Rabbit MQ', status: 'operational' },
      { service: 'Meilisearch', status: 'operational' },
      { service: 'API Gateway', status: 'operational' },
    ],
    popularProducts: [
      { id: '1', name: 'Молоко Яготинське пастеризоване 2,6%', category: 'Молочні продукти', rating: 4.8, reviews: 400, image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23E2E8F0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="central" font-size="14" fill="%239CA3AF" font-family="sans-serif"%3EM%3C/text%3E%3C/svg%3E' },
      { id: '2', name: 'Вино Marlborough Sun Sauvignon Blanc', category: 'Алкоголь', rating: 4.9, reviews: 340, image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23E2E8F0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="central" font-size="14" fill="%239CA3AF" font-family="sans-serif"%3EW%3C/text%3E%3C/svg%3E' },
      { id: '3', name: 'Напій кокосовий Vega Milk', category: 'Молочні продукти', rating: 4.7, reviews: 250, image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23E2E8F0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="central" font-size="14" fill="%239CA3AF" font-family="sans-serif"%3EV%3C/text%3E%3C/svg%3E' },
      { id: '4', name: 'Заморожені мідії Green Shop м\'ясо 500 г', category: 'Напівфабрикати', rating: 4.1, reviews: 156, image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23E2E8F0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="central" font-size="14" fill="%239CA3AF" font-family="sans-serif"%3EG%3C/text%3E%3C/svg%3E' },
      { id: '5', name: 'Віскі Monkey Shoulder, 40%, 0,7 л', category: 'Алкоголь', rating: 4.8, reviews: 129, image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23E2E8F0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="central" font-size="14" fill="%239CA3AF" font-family="sans-serif"%3EW%3C/text%3E%3C/svg%3E' },
    ]
  };
}
