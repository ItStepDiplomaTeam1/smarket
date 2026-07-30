const PRODUCTS_MAIN_CATEGORY_ID = '1';

export const getCategorySearchParams = (
  categoryId: string,
): Record<string, string> => (
  categoryId === 'products'
    ? { main_category_id: PRODUCTS_MAIN_CATEGORY_ID }
    : { category_slug: categoryId }
);
