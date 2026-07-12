import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface EtlHealthResponse {
  status: string;
  mongodb?: string;
  etl_running?: boolean;
}

export const useEtlStatus = () => {
  return useQuery<EtlHealthResponse, Error>({
    queryKey: ['etlStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<EtlHealthResponse>('/admin/etl/health');
      return data;
    },
    refetchInterval: 10000,
  });
};

export const useEtlControl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      const adminKey = import.meta.env.VITE_ETL_ADMIN_KEY;
      if (!adminKey) {
        throw new Error('ETL API Key is not configured in frontend .env');
      }

      const { data } = await apiClient.post(
        '/admin/etl/control',
        { action },
        {
          headers: {
            'X-Admin-Key': adminKey,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etlStatus'] });
      // Invalidate dashboardSummary to immediately fetch new system logs
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};
