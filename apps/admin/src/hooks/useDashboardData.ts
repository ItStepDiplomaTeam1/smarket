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
  const response = await apiClient.get<DashboardData>('/admin/dashboard-summary');
  if (!response.data?.metrics) {
    throw new Error('Dashboard API returned an invalid response');
  }
  return response.data;
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    staleTime: 10000,
  });
};
