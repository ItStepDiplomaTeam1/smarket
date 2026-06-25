import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductHero, About, FBT, SMProduct, Reviews, BottomCti } from '@/modules/Product'
import { apiClient } from '@/shared/api/apiClient';
import { type Product } from '@/modules/Product/type';

export default function ProductDetail() {
  const { idAndSlug } = useParams<{ idAndSlug: string }>();
  
  const extractedId = idAndSlug ? idAndSlug.split('-')[0] : null;
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
      <FBT />
      <SMProduct currentProduct={product}/>
      <BottomCti />
    </>
  )
}