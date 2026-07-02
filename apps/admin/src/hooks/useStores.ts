import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface Store {
  external_id: string;
  name: string;
  retail_chain: string;
  city?: string;
  is_active: boolean;
  synced_at: string;
}

const fetchStores = async (): Promise<Store[]> => {
  const { data } = await apiClient.get<Store[]>('/stores');
  return data;
};

/**
 * Custom TanStack Query hook to fetch stores.
 */
export function useStores() {
  return useQuery<Store[], Error>({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 60_000, // 1 хвилина кешу
  });
}
