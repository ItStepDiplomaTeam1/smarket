import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';

// -------------------------------------------------------
//  Типи для відгуків (відповідають ReviewResponse з бекенду)
// -------------------------------------------------------

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
}

// -------------------------------------------------------
//  GET — завантажити відгуки для конкретного товару
// -------------------------------------------------------

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

// -------------------------------------------------------
//  POST — створити новий відгук
// -------------------------------------------------------

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, ReviewCreatePayload>({
    mutationFn: async (payload) => {
      // Gateway сам підставить user_id та user_name з JWT-токена,
      // тому фронтенд передає лише тіло запиту
      const response = await apiClient.post<Review>(
        '/api/v1/reviews/',
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Інвалідуємо кеш відгуків для цього товару,
      // щоб список оновився без перезавантаження сторінки
      queryClient.invalidateQueries({ queryKey: ['reviews', data.product_id] });
    },
  });
};

// -------------------------------------------------------
//  DELETE — видалити свій відгук
// -------------------------------------------------------

export const useDeleteReview = (productId: number) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (reviewId) => {
      await apiClient.delete(`/api/v1/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });
};
