import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockCartsList, mockCartDetails } from '@/mocks/cartData';
import type { CartListItem, CartDetailResponse } from '@/mocks/cartData';

const DELAY_MS = 800;

// Utility to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useFetchCarts = () => {
  return useQuery<CartListItem[]>({
    queryKey: ['carts'],
    queryFn: async () => {
      await delay(DELAY_MS);
      return mockCartsList;
    },
  });
};

export const useFetchCartDetails = (cartId: string | null) => {
  return useQuery<CartDetailResponse>({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      await delay(DELAY_MS);
      if (!cartId || !mockCartDetails[cartId]) {
        throw new Error('Cart not found');
      }
      return mockCartDetails[cartId];
    },
    enabled: !!cartId,
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId, quantity }: { cartId: string; productId: string; quantity: number }) => {
      await delay(DELAY_MS);
      // In a real app, this would be an API call returning the updated cart or success status.
      // We simulate success here.
      return { cartId, productId, quantity };
    },
    onSuccess: (data) => {
      // Invalidate both the list and the specific cart details to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: ['cart', data.cartId] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useDeleteCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      await delay(DELAY_MS);
      return cartId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useCreateCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await delay(DELAY_MS);
      return "new-cart-id"; // Simulated ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      await delay(DELAY_MS);
      return cartId;
    },
    onSuccess: (_, cartId) => {
      queryClient.invalidateQueries({ queryKey: ['cart', cartId] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};
