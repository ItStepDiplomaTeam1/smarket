import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

const fetchRecentUsers = async (limit: number): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<AdminUser[]>('/admin/recent-users', {
    params: { limit },
  });
  return data;
};

/**
 * Fetches the most recently registered users from the Auth Service via Gateway.
 *
 * @param limit - Max number of users to return (default: 5).
 * staleTime is 2 minutes — avoids redundant network calls on dashboard tab switches.
 */
export function useAdminUsers(limit: number = 5) {
  return useQuery<AdminUser[], Error>({
    queryKey: ['adminUsers', limit],
    queryFn: () => fetchRecentUsers(limit),
    staleTime: 120_000, // 2 minutes
    retry: 1,
  });
}
