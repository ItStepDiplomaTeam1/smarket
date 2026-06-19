import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { CartListItem, CartDetailResponse } from '@/mocks/cartData';

// We map the backend responses to the frontend types.
// The backend now returns:
// GET /api/v1/cart/ -> list of { id, name, updated_at, total_price, ... }
// POST /api/v1/cart/ -> creates cart with name
// GET /api/v1/cart/{cart_id} -> detailed cart with items
// POST /api/v1/cart/{cart_id}/items -> adds item
// DELETE /api/v1/cart/{cart_id}/items/{item_id} -> removes item
// DELETE /api/v1/cart/{cart_id} -> deletes cart

export const useFetchCarts = () => {
  return useQuery<CartListItem[]>({
    queryKey: ['carts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/cart/');
      // Map backend response to CartListItem
      return data.map((cart: { id: string; name: string; items?: unknown[]; total_price?: number; updated_at: string }) => ({
        id: cart.id,
        title: cart.name,
        itemsCount: cart.items?.length || 0,
        bestStore: '-', // We will update this later with comparison data if needed
        bestPrice: cart.total_price || 0,
        potentialSavings: 0,
        updatedAt: cart.updated_at,
      }));
    },
  });
};

export const useFetchCartDetails = (cartId: string | null) => {
  return useQuery<CartDetailResponse | null>({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/cart/${cartId}`);
      
      // Fetch comparison to populate the summary
      let comparisonData = [];
      try {
        const compRes = await apiClient.get(`/api/v1/cart/${cartId}/compare`);
        comparisonData = compRes.data.map((c: { store_name: string; total_price: number; is_complete: boolean }) => ({
          storeName: c.store_name,
          totalPrice: c.total_price,
          isBest: c.is_complete,
        }));
      } catch (err) {
        console.error("Failed to fetch comparison", err);
      }
      
      return {
        id: data.id,
        title: data.name,
        itemsCount: data.items.length,
        bestStore: comparisonData[0]?.storeName || '-',
        bestPrice: comparisonData[0]?.totalPrice || data.total_price,
        potentialSavings: 0,
        updatedAt: data.updated_at,
        items: data.items.map((item: { product_id: string; product_name: string; quantity: number; price: number; id: string }) => ({
          productId: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          basePrice: item.price,
          totalItemPrice: item.price * item.quantity,
          id: item.id // mapping the cart_item id
        })),
        summary: {
          totalItems: data.items.length,
          maxPossibleSavings: 0,
          comparison: comparisonData
        }
      };
    },
    enabled: !!cartId,
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId, quantity }: { cartId: string; productId: string; quantity: number }) => {
      const { data } = await apiClient.post(`/api/v1/cart/${cartId}/items`, {
        product_id: parseInt(productId, 10),
        quantity: quantity
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useDeleteCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, itemId }: { cartId: string; itemId: string }) => {
      const { data } = await apiClient.delete(`/api/v1/cart/${cartId}/items/${itemId}`);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useDeleteCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      await apiClient.delete(`/api/v1/cart/${cartId}`);
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
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post('/api/v1/cart/', { name });
      return data.id;
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
      await apiClient.delete(`/api/v1/cart/${cartId}/items`);
      return cartId;
    },
    onSuccess: (_, cartId) => {
      queryClient.invalidateQueries({ queryKey: ['cart', cartId] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};
