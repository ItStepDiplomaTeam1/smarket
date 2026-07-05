import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useToggleCategoryVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, isHidden }: { categoryId: number; isHidden: boolean }) => {
      await apiClient.patch(`/products/categories/${categoryId}/visibility`, { is_hidden: isHidden });
      return { categoryId, isHidden };
    },
    onMutate: async ({ categoryId, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);

      queryClient.setQueryData<Category[]>(['categories'], (old) => {
        if (!old) return old;
        return old.map(c => c.id === categoryId ? { ...c, is_hidden: isHidden } : c);
      });

      return { previousCategories };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
    }
  });
};
