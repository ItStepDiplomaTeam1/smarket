import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductHero, About, RecentlyViewed, SMProduct, Reviews} from '@/modules/Product'
import { apiClient } from '@/shared/api/apiClient';
import { type Product } from '@/modules/Product/type';
import { generateSlug } from '@/shared/utils/url';

export default function ProductDetail() {
  // Універсальний парсинг ID
  const params = useParams<{ idAndSlug?: string; id?: string }>();
  const navigate = useNavigate();
  const rawParam = params.idAndSlug || params.id; 
  const extractedId = rawParam ? rawParam.split('-')[0] : null;
  const productId = extractedId ? Number(extractedId) : null;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    let isMounted = true;

    const loadProductWithRetries = async () => {
      setIsLoading(true);
      setNotFound(false);
      setProduct(null);

      const maxRetries = 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await apiClient.get(`/api/v1/products/${productId}`);
          if (isMounted) {
            setProduct(response.data);
            setIsLoading(false);
          }
          return;
        } catch (error: any) {
          // Якщо сервер повернув 404 — товар не існує, ретраї не потрібні
          if (error?.response?.status === 404) {
            if (isMounted) {
              setNotFound(true);
              setIsLoading(false);
            }
            return;
          }

          // Якщо залишилися спроби — робимо паузу 1с перед повторним запитом
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      // Якщо всі спроби вичерпано і товар так і не завантажився
      if (isMounted) {
        console.error('Помилка завантаження товару після ретраїв');
        setNotFound(true);
        setIsLoading(false);
      }
    };

    loadProductWithRetries();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Автоматичне оновлення URL для відображення слага (SEO URL)
  useEffect(() => {
    if (product && productId) {
      const canonicalSlug = generateSlug(product.title);
      const expectedParam = `${productId}-${canonicalSlug}`;
      if (rawParam !== expectedParam) {
        navigate(`/product/${expectedParam}`, { replace: true });
      }
    }
  }, [product, productId, rawParam, navigate]);

  // Зберігаємо переглянутий товар в localStorage
  useEffect(() => {
    // Ігноруємо mock-ID (>=999000) — вони не існують в базі
    if (!productId || isNaN(productId) || productId >= 999000) return;
    try {
      const key = 'recently_viewed_products';
      const stored = localStorage.getItem(key);
      let viewedIds: string[] = stored ? JSON.parse(stored) : [];
      const idStr = String(productId);
      viewedIds = viewedIds.filter(id => id !== idStr);
      viewedIds.unshift(idStr);
      if (viewedIds.length > 20) viewedIds = viewedIds.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(viewedIds));
    } catch (e) {
      console.error('Помилка збереження в localStorage:', e);
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#F6FAF8] dark:bg-[#111A17] text-[#265447] dark:text-[#3DAE8B] font-semibold">
        Завантаження товару...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center bg-[#F6FAF8] dark:bg-[#111A17] gap-[16px]">
        <span className="text-[48px]">😔</span>
        <h1 className="font-manrope text-[24px] font-[200] text-[#173B33] dark:text-white m-0">Товар не знайдено</h1>
        <p className="font-inter text-[14px] text-[#6D8279] dark:text-[#A9B6B0] m-0">Перевірте посилання або поверніться до каталогу</p>
        <a
          href="/catalog"
          className="mt-[8px] px-[24px] py-[10px] rounded-[10px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] font-inter text-[14px] font-semibold no-underline transition-colors hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C]"
        >
          До каталогу
        </a>
      </div>
    );
  }

  return (
    <>
      <ProductHero product={product} />
      <About product={product} />
      <Reviews productId={productId!} />
      <RecentlyViewed currentProductId={productId!} />
      <SMProduct currentProduct={product}/>
      {/*<BottomCti />*/}
    </>
  )
}