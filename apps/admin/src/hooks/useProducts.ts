import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface MeiliSearchProduct {
  id: number;
  title: string;
  brand: string | null;
  unit: string;
  weight: number;
  image_url: string | null;
  canonical_ean: string | null;
  category_id: number | null;
  category_slug: string | null;
  category_name: string | null;
  is_hidden: boolean;
  offers: Array<{
    store: {
      id: string;
      name: string | null;
      retail_chain: string | null;
    };
    price: number;
    old_price: number | null;
    in_stock: boolean;
  }>;
}

export interface MeiliSearchResponse {
  hits: MeiliSearchProduct[];
  total_hits: number;
  offset: number;
  limit: number;
  nb_hits: number;
  processing_time_ms: number;
  query: string;
}

interface FetchProductsParams {
  q?: string;
  page: number;
  limit: number;
  categorySlug?: string;
  retailChain?: string;
  inStock?: boolean;
}

const fetchProducts = async (params: FetchProductsParams): Promise<MeiliSearchResponse> => {
  const offset = (params.page - 1) * params.limit;
  const queryParams: Record<string, any> = {
    q: params.q?.trim() || '',
    limit: params.limit,
    offset,
  };

  if (params.categorySlug) {
    queryParams.category_slug = params.categorySlug;
  }
  if (params.retailChain) {
    queryParams.retail_chain = params.retailChain;
  }
  if (params.inStock !== undefined) {
    queryParams.in_stock = params.inStock;
  }

  const { data } = await apiClient.get<MeiliSearchResponse>('/search/search', {
    params: queryParams,
  });
  return data;
};

export function useProducts(params: FetchProductsParams) {
  return useQuery<MeiliSearchResponse, Error>({
    queryKey: ['productsSearch', params],
    queryFn: () => fetchProducts(params),
    staleTime: 30_000,
  });
}

export const useToggleProductVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isHidden }: { productId: number; isHidden: boolean }) => {
      await apiClient.patch(`/products/${productId}/visibility`, { is_hidden: isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsSearch'] });
    },
  });
};
