import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductHero, About, RecentlyViewed, SMProduct, Reviews, BottomCti } from '@/modules/Product'
import { apiClient } from '@/shared/api/apiClient';
import { type Product } from '@/modules/Product/type';

export default function ProductDetail() {
  // Універсальний парсинг ID
  const params = useParams<{ idAndSlug?: string; id?: string }>();
  const rawParam = params.idAndSlug || params.id; 
  const extractedId = rawParam ? rawParam.split('-')[0] : null;
  const productId = Number(extractedId) || 1;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/v1/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Помилка завантаження товару:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Зберігаємо переглянутий товар в localStorage
  useEffect(() => {
    if (!productId) return;
    try {
      const key = 'recently_viewed_products';
      const stored = localStorage.getItem(key);
      let viewedIds: string[] = stored ? JSON.parse(stored) : [];
      const idStr = String(productId);
      // Видаляємо дублікат, якщо вже є
      viewedIds = viewedIds.filter(id => id !== idStr);
      // Додаємо на початок (найновіший першим)
      viewedIds.unshift(idStr);
      // Обмежуємо до 20 товарів
      if (viewedIds.length > 20) viewedIds = viewedIds.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(viewedIds));
    } catch (e) {
      console.error('Помилка збереження в localStorage:', e);
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#F6FAF8] text-[#265447] font-semibold">
        Завантаження товару...
      </div>
    );
  }

  return (
    <>
      <ProductHero product={product} />
      <About product={product} />
      <Reviews productId={productId} />
      <RecentlyViewed currentProductId={productId} />
      <SMProduct currentProduct={product}/>
      <BottomCti />
    </>
  )
}