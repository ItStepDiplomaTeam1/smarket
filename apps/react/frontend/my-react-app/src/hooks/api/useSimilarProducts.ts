import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type {
  Product,
  ProductPrice,
} from '@/modules/Product/type';

interface ProductOfferPayload {
  store: ProductPrice['store'];
  price: number;
  old_price: number | null;
  in_stock: boolean;
  recorded_at: string;
}

type SimilarProductPayload = Omit<Product, 'prices'> & {
  prices?: ProductPrice[];
  offers?: ProductOfferPayload[];
};

interface PaginatedProductsPayload {
  items: SimilarProductPayload[];
}

const normalizeProduct = (product: SimilarProductPayload): Product => ({
  ...product,
  prices:
    product.prices ??
    product.offers?.map((offer, index) => ({
      id: index,
      product_id: product.id,
      store_id: offer.store.external_id,
      price: offer.price,
      old_price: offer.old_price,
      in_stock: offer.in_stock,
      recorded_at: offer.recorded_at,
      store: offer.store,
    })) ??
    [],
});

export const useSimilarProducts = (
  currentProductId: number | undefined,
  categoryId: number | undefined,
) =>
  useQuery<Product[]>({
    queryKey: ['products', 'similar', categoryId, currentProductId],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<PaginatedProductsPayload>(
        '/api/v1/products',
        {
          params: {
            category: categoryId,
            limit: 5,
            sort_by: 'popular',
          },
          signal,
        },
      );

      return data.items
        .filter((product) => product.id !== currentProductId)
        .slice(0, 4)
        .map(normalizeProduct);
    },
    enabled:
      Number.isInteger(currentProductId) &&
      Number.isInteger(categoryId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
