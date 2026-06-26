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
