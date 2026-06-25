export interface Store {
  external_id: string;
  name: string;
  retail_chain: string;
  city: string;
  is_active: boolean;
  synced_at: string;
}

export interface ProductPrice {
  id: number;
  product_id: number;
  store_id: string;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  recorded_at: string;
  store: Store;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Product {
  id: number;
  ean: string | null;
  store_product_id: string;
  title: string;
  brand: string;
  unit: string;
  weight: number;
  image_url: string | null;
  canonical_category_id: number | null;
  category: Category | null;
  created_at: string;
  prices: ProductPrice[];
}