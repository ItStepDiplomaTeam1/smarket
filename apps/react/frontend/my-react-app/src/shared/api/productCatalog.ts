import { apiClient } from '@/shared/api/apiClient';

interface CatalogProductRecord {
  id: number;
  is_hidden?: boolean;
}

const MAX_BATCH_SIZE = 50;

const fetchProductBatch = async <T extends CatalogProductRecord>(
  productIds: number[],
): Promise<T[]> => {
  const params = new URLSearchParams();
  productIds.forEach((productId) => {
    params.append('product_ids', productId.toString());
  });

  const { data } = await apiClient.get<T[]>(
    `/api/v1/products/batch/offers?${params.toString()}`,
  );
  return Array.isArray(data) ? data : [];
};

export const fetchExistingProducts = async <T extends CatalogProductRecord>(
  productIds: number[],
): Promise<T[]> => {
  const uniqueIds = Array.from(new Set(productIds));
  if (uniqueIds.length === 0) return [];

  const batches: number[][] = [];
  for (let index = 0; index < uniqueIds.length; index += MAX_BATCH_SIZE) {
    batches.push(uniqueIds.slice(index, index + MAX_BATCH_SIZE));
  }

  const products = await Promise.all(
    batches.map((batch) => fetchProductBatch<T>(batch)),
  );

  return products.flat();
};
