import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceStatus = 'Працює' | 'Помилка';

export interface SystemStatusData {
  PostgreSQL: ServiceStatus;
  Redis: ServiceStatus;
  Meilisearch: ServiceStatus;
  RabbitMQ: ServiceStatus;
  'API Gateway': ServiceStatus;
  [key: string]: ServiceStatus;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

const fetchSystemStatus = async (): Promise<SystemStatusData> => {
  const { data } = await apiClient.get<SystemStatusData>('/admin/system-status');
  return data;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches real-time operational status of all backend infrastructure.
 * Automatically re-fetches every 30 seconds for live dashboard updates.
 * Each service maps to either "Працює" (healthy) or "Помилка" (failed).
 */
export function useSystemStatus() {
  return useQuery<SystemStatusData, Error>({
    queryKey: ['systemStatus'],
    queryFn: fetchSystemStatus,
    refetchInterval: 30_000, // 30 seconds — live dashboard polling
    staleTime: 25_000,       // consider data fresh for 25s to avoid redundant calls
    retry: 1,
  });
}
