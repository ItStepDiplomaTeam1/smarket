import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string;           // відсутній в поточній версії бекенду
  status: string;          // 'Активний' | 'Неактивний'
  created_at: string;
  // Поля-заглушки (бекенд поки не повертає)
  cart_count?: number;
  reviews_count?: number;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
}

const fetchRecentUsers = async (): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<AdminUser[]>('/admin/recent-users', {
    params: { limit: 100 },
  });
  return data;
};

/**
 * Хук для отримання списку користувачів через наявний ендпоінт recent-users.
 * Коли бекенд додасть GET /admin/users — замінити на нього.
 */
export function useUsers() {
  return useQuery<AdminUser[], Error>({
    queryKey: ['admin-users'],
    queryFn: fetchRecentUsers,
    staleTime: 30_000,
  });
}
