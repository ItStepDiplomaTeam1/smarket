import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchCarts } from '@/hooks/api/useCartApi';
import { useFetchUserReviews, type Review } from '@/hooks/api/useReviewsApi';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { apiClient } from '@/shared/api/apiClient';

function formatDate(iso: string): string {
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
  ];
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function MainContent() {
  const user = useAuthStore((s) => s.user);
  const { data: carts } = useFetchCarts();
  const { data: userReviews = [], isLoading: reviewsLoading, isError: reviewsError } = useFetchUserReviews(user?.id);
  const navigate = useNavigate();
  const { items: favorites, load: loadFavorites, isLoaded } = useFavoritesStore();

  useEffect(() => {
    if (!isLoaded) {
      loadFavorites();
    }
  }, [isLoaded, loadFavorites]);

  const latestReviews = useMemo(() => {
    return [...userReviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [userReviews]);

  // Завантажуємо інформацію про товари для відгуків (назва, фото)
  const [productsMap, setProductsMap] = useState<Record<number, { title: string; image_url: string | null }>>({});

  useEffect(() => {
    if (latestReviews.length === 0) return;

    const productIds = [...new Set(latestReviews.map((r) => r.product_id))];
    const idsToFetch = productIds.filter((id) => !productsMap[id]);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      const results: Record<number, { title: string; image_url: string | null }> = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const { data, status } = await apiClient.get(`/api/v1/products/${id}`, {
              validateStatus: (s) => s === 200 || s === 404,
            });
            if (status === 200 && data?.title) {
              results[id] = { title: data.title, image_url: data.image_url };
            } else {
              results[id] = { title: `Товар #${id}`, image_url: null };
            }
          } catch (err) {
            results[id] = { title: `Товар #${id}`, image_url: null };
          }
        })
      );
      if (!cancelled) {
        setProductsMap((prev) => ({ ...prev, ...results }));
      }
    })();
    return () => { cancelled = true; };
  }, [latestReviews]);

  // Відображуване ім'я для привітання: якщо є name — ім'я, інакше email
  const userName = user?.name || user?.email || 'Користувачу';

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "currentColor"} className="shrink-0">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  const BreadcrumbChevron = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mx-[2px]">
      <path d="M4.5 9L7.5 6L4.5 3" stroke="#6D8279" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <section className="w-full font-inter flex-1 min-w-0">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-[24px]">
        
        {/* Хлібні крихти та Заголовок */}
        <div className="mb-[24px]">
          <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
            <span className="cursor-pointer hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors">Головна</span>
            <BreadcrumbChevron />
            <span className="text-[#94A3B8] font-semibold">Особистий кабінет</span>
          </div>
          <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] dark:text-white m-0">Особистий кабінет</h1>
        </div>

        {/* Секція Збережені кошики та Обрані товари */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] mb-[24px] items-stretch">
          
          {/* Welcome Banner */}
          <div className="xl:col-start-1 xl:col-end-2 xl:row-start-1 xl:row-end-2 bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-[24px] flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[8px]">
              <h2 className="font-manrope text-[24px] font-[800] text-[#173B33] dark:text-white leading-[31.2px] m-0">
                Вітаємо, {userName}! 👋
              </h2>
              <p className="font-inter text-[14px] font-normal text-[#6D8279] dark:text-[#94A3B8] leading-[19.6px] m-0">
                Ми допоможемо вам економити час і гроші, знаходячи <br /> найкращі ціни в улюблених магазинах швидко і зручно.
              </p>
            </div>
            <button className="bg-[#173B33] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] font-inter text-[13px] font-bold px-[19px] h-[36px] w-fit flex items-center justify-center rounded-[10px] hover:bg-[#265447] dark:hover:bg-[#2E9B78] transition-colors leading-none cursor-pointer border-none">
              Редагувати профіль
            </button>
          </div>

          {/* Блок: Збережені кошики — тільки якщо є хоча б 1 кошик */}
          {carts && carts.length > 0 && (
            <div className="xl:col-start-1 xl:col-end-2 xl:row-start-2 xl:row-end-3 bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] py-[24px] px-[24px] flex flex-col w-full">
              <h3 className="font-manrope text-[18px] font-bold text-[#173B33] dark:text-white m-0 mb-[8px]">Збережені кошики</h3>
              <p className="font-inter text-[12px] text-[#6D8279] dark:text-[#94A3B8] m-0 mb-[24px]">
                Оберіть кошик, щоб переглянути товари та порівняти магазини.
              </p>
              
              <div className={`flex flex-col gap-[16px] mb-[24px] ${carts.length > 2 ? 'max-h-[254px] overflow-y-auto pr-[4px]' : ''}`}
                style={carts.length > 2 ? { scrollbarWidth: 'thin', scrollbarColor: '#265447 transparent' } : undefined}
              >
                {carts.map((cart) => (
                  <div key={cart.id} className="flex justify-between border border-[#E5E7EB] dark:border-[#4ADE80] bg-white dark:bg-[#1C2723] rounded-[10px] p-[12px] h-[111px] shrink-0">
                    <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-[8px]">
                      <h4 className="font-manrope text-[15px] font-bold text-[#173B33] dark:text-white m-0 truncate">{cart.title}</h4>
                      <div className="my-auto"><span className="font-inter text-[12px] text-[#6D8279] dark:text-[#94A3B8]">{cart.itemsCount} товарів · {formatDate(cart.updatedAt)}</span></div>
                      <span className="font-inter text-[12px] font-semibold text-[#173B33] dark:text-white">{cart.bestStore}</span>
                    </div>
                    <div className="flex flex-col justify-between items-end h-full">
                      <div className="h-[22px] px-[8px] bg-[#FACC14] rounded-[6px] flex items-center justify-center shrink-0">
                        <span className="font-inter text-[12px] font-bold text-[#173333] leading-none">Економія {Math.round(cart.potentialSavings)} ₴</span>
                      </div>
                      <span className="font-manrope text-[16px] font-bold text-[#173B33] dark:text-[#4ADE80]">{Math.round(cart.bestPrice)} грн</span>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/cart" className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] dark:text-[#94A3B8] mt-auto hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors w-full no-underline">
                Переглянути всі кошики
                <ArrowRightIcon />
              </a>
            </div>
          )}

          {/* Блок: Обрані товари */}
          <div className="xl:col-start-2 xl:col-end-3 xl:row-start-2 xl:row-end-3 bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] py-[24px] px-[24px] flex flex-col h-full w-full">
            <h3 className="font-manrope text-[18px] font-bold text-[#173B33] dark:text-white m-0 mb-[24px]">Обрані товари</h3>
            
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[32px] flex-1">
                <svg className="w-8 h-8 text-[#9CA3AF] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <p className="font-manrope font-semibold text-[14px] text-[#265447] m-0 mb-1">Немає обраних товарів</p>
                <p className="font-inter text-[12px] text-[#6D8279] m-0">Додайте товари з каталогу, щоб бачити їх тут.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-[12px] mb-[24px]">
                {favorites.slice(0, 4).map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between w-full h-[56px] cursor-pointer hover:bg-[#F6FAF8] dark:hover:bg-[#1A2E25]/30 p-1 rounded-[8px] transition-colors"
                    onClick={() => navigate(`/product/${product.product_id}`)}
                  >
                    <div className="flex items-center gap-[12px] flex-1 min-w-0 pr-[16px]">
                      <div className="w-[44px] h-[56px] bg-[#F6FAF8] dark:bg-[#111A17] rounded-[5px] shrink-0 border border-[#265447]/[0.08] dark:border-[#265447]/30 flex items-center justify-center overflow-hidden">
                        {product.product_image_url ? (
                          <img src={product.product_image_url} alt={product.product_title ?? ''} className="max-w-full max-h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                        ) : (
                          <svg className="w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        )}
                      </div>
                      <div className="flex flex-col justify-center h-[56px] py-[2px] min-w-0 flex-1">
                        <h4 className="font-inter text-[12px] font-medium text-[#173B33] dark:text-white leading-[14px] m-0 line-clamp-2 break-words">
                          {product.product_title ?? `Товар #${product.product_id}`}
                        </h4>
                        <span className="font-inter text-[10px] text-[#6D8279] dark:text-[#94A3B8] mt-1 leading-none m-0">
                          Додано {formatDate(product.added_at)}
                        </span>
                      </div>
                    </div>
                    <div className="font-manrope text-[14px] font-bold text-[#173B33] dark:text-[#4ADE80] text-right shrink-0 whitespace-nowrap">
                      {product.product_price !== null ? `${product.product_price} ₴` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] dark:text-[#94A3B8] mt-auto hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors w-full no-underline"
            >
              Перейти до каталогу
              <ArrowRightIcon />
            </a>
          </div>

        </div>

        {/* Блок: Відгуки */}
        <div className="w-full bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] py-[24px] px-[24px] flex flex-col w-full">
          <h3 className="font-manrope text-[18px] font-bold text-[#173B33] dark:text-white m-0 mb-[24px]">Відгуки</h3>
          
          {/* Стан завантаження */}
          {reviewsLoading && (
            <div className="flex items-center justify-center py-[32px] flex-grow">
              <svg className="animate-spin mr-[8px]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(38,84,71,0.2)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#3DAE8B" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="font-inter text-[14px] text-[#94A3B8]">Завантаження відгуків...</span>
            </div>
          )}

          {/* Помилка завантаження */}
          {reviewsError && (
            <div className="flex items-center gap-[8px] bg-[#2D1515] border border-[#EF4444]/30 rounded-[12px] px-[20px] py-[16px] mb-[16px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-inter text-[14px] text-[#EF4444]">Не вдалося завантажити відгуки. Спробуйте оновити сторінку.</span>
            </div>
          )}

          {/* Пустий стан */}
          {!reviewsLoading && !reviewsError && latestReviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-[32px] flex-grow">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[12px]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="font-manrope font-semibold text-[15px] text-[#3DAE8B] m-0 mb-[4px]">Ще немає відгуків</p>
              <p className="font-inter text-[13px] text-[#94A3B8] m-0">Ваші відгуки на товари з'являться тут.</p>
            </div>
          )}

          {/* Список відгуків */}
          {!reviewsLoading && !reviewsError && latestReviews.length > 0 && (
            <div className="flex flex-col gap-[12px] mb-[24px] flex-grow">
              {latestReviews.map((review: Review) => {
                const productInfo = productsMap[review.product_id];
                const productTitle = productInfo?.title || `Товар #${review.product_id}`;
                const productImage = productInfo?.image_url;

                return (
                  <div key={review.id} className="flex items-center justify-between w-full h-[56px] gap-[12px]">
                    <div className="flex items-center gap-[12px] flex-1 min-w-0">
                      <div className="w-[44px] h-[56px] bg-white dark:bg-[#111A17] rounded-[5px] shrink-0 border border-[#E5E7EB] dark:border-[#265447]/30 flex items-center justify-center overflow-hidden p-[2px]">
                        {productImage ? (
                          <img src={productImage} alt={productTitle} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.3 7 8.7 5 8.7-5" />
                            <path d="M12 22V12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h4 className="font-inter text-[12px] font-medium text-[#173B33] dark:text-white leading-[15.6px] m-0 line-clamp-2 break-words">{productTitle}</h4>
                      </div>
                    </div>
                    <div className="flex shrink-0 text-[#E8E8E8] dark:text-[#265447]">
                      {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link to="/profile/reviews" className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] dark:text-[#94A3B8] mt-auto hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors w-full no-underline pt-[16px]">
            Переглянути всі відгуки
            <ArrowRightIcon />
          </Link>
        </div>

      </div>
    </section>
  );
}