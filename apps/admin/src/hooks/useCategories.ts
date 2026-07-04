import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface Category {
  id: number;
  slug: string;
  name: string;
  // Наступні поля ми очікуємо з бекенду в майбутньому, 
  // тому робимо їх опціональними.
  is_hidden?: boolean;
  created_at?: string;
  updated_at?: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get<Category[]>('/products/categories');
  return data;
};

/**
 * Custom TanStack Query hook to fetch categories.
 */
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 60_000, // 1 хвилина кешу
  });
}
