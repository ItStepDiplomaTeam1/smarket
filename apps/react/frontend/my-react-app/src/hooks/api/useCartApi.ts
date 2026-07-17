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
      return data.map((cart: { id: string; name: string; items?: unknown[]; total_price?: number; updated_at: string }) => ({
        id: cart.id,
        title: cart.name,
        itemsCount: cart.items?.length || 0,
        bestStore: '-', 
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
      
      const itemsWithImages = data.items.map((item: { product_id: string; product_name: string; quantity: number; price: number; id: string; image_url?: string }) => {
        return {
          productId: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          basePrice: item.price,
          totalItemPrice: item.price * item.quantity,
          id: item.id,
          imageUrl: item.image_url
        };
      });

      return {
        id: data.id,
        title: data.name,
        itemsCount: data.items.length,
        bestStore: '-',
        bestPrice: data.total_price || 0,
        potentialSavings: 0,
        updatedAt: data.updated_at,
        items: itemsWithImages,
        summary: {
          totalItems: data.items.length,
          maxPossibleSavings: 0,
          comparison: []
        }
      };
    },
    enabled: !!cartId,
  });
};

export const useFetchCartComparison = (cartId: string | null) => {
  return useQuery({
    queryKey: ['cart-compare', cartId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/cart/${cartId}/compare`);
      return data.map((c: { store_name: string; total_price: number; is_complete: boolean }) => ({
        storeName: c.store_name,
        totalPrice: c.total_price,
        isBest: c.is_complete,
      }));
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

export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, itemId, quantity }: { cartId: string; itemId: string; quantity: number }) => {
      const { data } = await apiClient.put(`/api/v1/cart/${cartId}/items/${itemId}`, {
        quantity: quantity
      });
      return data;
    },
    onMutate: async (newVariables) => {
      await queryClient.cancelQueries({ queryKey: ['cart', newVariables.cartId] });
      const previousCart = queryClient.getQueryData(['cart', newVariables.cartId]);

      if (previousCart) {
        queryClient.setQueryData(['cart', newVariables.cartId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.id === newVariables.itemId
                ? { 
                    ...item, 
                    quantity: newVariables.quantity,
                    totalItemPrice: item.basePrice * newVariables.quantity
                  }
                : item
            )
          };
        });
      }

      return { previousCart };
    },
    onError: (err, newVariables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', newVariables.cartId], context.previousCart);
      }
    },
    onSettled: (data, error, variables) => {
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

export const useDuplicateCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      const { data } = await apiClient.post(`/api/v1/cart/${cartId}/duplicate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};


export interface ReceiptSnapshotItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  in_stock: boolean;
}

export interface ReceiptSnapshotStore {
  store_id: string;
  store_name: string;
  retail_chain: string;
  address?: string;
  lat?: number;
  lng?: number;
  is_complete: boolean;
  items: ReceiptSnapshotItem[];
  subtotal: number;
}

export interface ReceiptResponse {
  id: string;
  cart_id?: string;
  created_at: string;
  total_price: number;
  savings_amount: number;
  share_token: string;
  ai_description?: string;
  snapshot: ReceiptSnapshotStore[];
}

export interface ReceiptListItem {
  id: string;
  share_token: string;
  created_at: string;
  total_price: number;
  savings_amount: number;
  store_name: string;
}

export const useCompleteCart = () => {
  const queryClient = useQueryClient();

  return useMutation<ReceiptResponse, Error, string>({
    mutationFn: async (cartId: string) => {
      const { data } = await apiClient.post(`/api/v1/cart/${cartId}/complete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-receipts'] });
    },
  });
};

export const useGetReceipt = (token: string) => {
  return useQuery<ReceiptResponse>({
    queryKey: ['receipt', token],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/cart/receipts/${token}`);
      return data;
    },
    enabled: !!token,
  });
};

export const useGetMyReceipts = () => {
  return useQuery<ReceiptListItem[], Error>({
    queryKey: ['my-receipts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/cart/receipts');
      return data;
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; message: string }, Error, string>({
    mutationFn: async (receiptId: string) => {
      const { data } = await apiClient.delete(`/api/v1/cart/receipts/${receiptId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-receipts'] });
    },
  });
};

export const useImportCart = () => {
  const queryClient = useQueryClient();

  return useMutation<{ new_cart_id: string; message: string }, Error, string>({
    mutationFn: async (sharedCartId: string) => {
      const { data } = await apiClient.post(`/api/v1/cart/import/${sharedCartId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });
};

export const useFetchSharedCart = (cartId: string | null) => {
  return useQuery({
    queryKey: ['shared-cart', cartId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/cart/shared/${cartId}`);
      return data;
    },
    enabled: !!cartId,
  });
};
