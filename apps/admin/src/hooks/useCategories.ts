import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface GlobalCategory {
  id: number;
  name: string;
  is_hidden: boolean;
}

const fetchCategories = async (): Promise<GlobalCategory[]> => {
  const { data } = await apiClient.get<GlobalCategory[]>('/products/categories/global');
  return data;
};

/**
 * Custom TanStack Query hook to fetch global categories.
 */
export function useCategories() {
  return useQuery<GlobalCategory[], Error>({
    queryKey: ['global_categories'],
    queryFn: fetchCategories,
    staleTime: 60_000, // 1 хвилина кешу
  });
}

export const useToggleCategoryVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, isHidden }: { categoryId: number; isHidden: boolean }) => {
      await apiClient.patch(`/products/categories/global/${categoryId}/visibility`, { is_hidden: isHidden });
      return { categoryId, isHidden };
    },
    onMutate: async ({ categoryId, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: ['global_categories'] });
      const previousCategories = queryClient.getQueryData<GlobalCategory[]>(['global_categories']);

      queryClient.setQueryData<GlobalCategory[]>(['global_categories'], (old) => {
        if (!old) return old;
        return old.map(c => c.id === categoryId ? { ...c, is_hidden: isHidden } : c);
      });

      return { previousCategories };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['global_categories'], context.previousCategories);
      }
    }
  });
};
