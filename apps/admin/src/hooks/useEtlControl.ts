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
      // The infrastructure key is injected by gateway after JWT role
      // verification. It must never be compiled into the browser bundle.
      const { data } = await apiClient.post('/admin/etl/control', { action });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etlStatus'] });
      // Invalidate dashboardSummary to immediately fetch new system logs
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};
