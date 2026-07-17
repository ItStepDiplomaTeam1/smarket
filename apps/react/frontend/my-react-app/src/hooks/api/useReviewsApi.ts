import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '@/modules/Auth/store/authStore';


export interface Review {
  id: string;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  text: string | null;
  created_at: string;
}

export interface ReviewCreatePayload {
  product_id: number;
  rating: number;
  text?: string;
  user_name?: string;
}


export const useFetchProductReviews = (productId: number) => {
  return useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await apiClient.get<Review[]>(
        `/api/v1/reviews/product/${productId}`
      );
      return response.data;
    },
    enabled: productId > 0,
  });
};

export const useFetchUserReviews = (userId: string | undefined) => {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'user', userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Review[]>(
          `/api/v1/reviews/user/${userId}`
        );
        return response.data;
      } catch (error: any) {
        // Якщо ендпоінт ще не задеплоєно (405/404) — повертаємо пустий масив
        if (error?.response?.status === 405 || error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!userId,
    retry: false,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, ReviewCreatePayload>({
    mutationFn: async (payload) => {
      const userName = useAuthStore.getState().user?.name;
      const response = await apiClient.post<Review>(
        '/api/v1/reviews/',
        { ...payload, user_name: userName || undefined }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.product_id] });
    },
  });
};


export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (reviewId) => {
      await apiClient.delete(`/api/v1/reviews/${reviewId}`);
    },
    onSuccess: () => {
      // Інвалідуємо всі кеші відгуків (і по продукту, і по користувачу)
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};


export interface ReviewUpdatePayload {
  reviewId: string;
  rating: number;
  text?: string | null;
}

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, ReviewUpdatePayload>({
    mutationFn: async ({ reviewId, rating, text }) => {
      const response = await apiClient.put<Review>(
        `/api/v1/reviews/${reviewId}`,
        { rating, text: text || null }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
