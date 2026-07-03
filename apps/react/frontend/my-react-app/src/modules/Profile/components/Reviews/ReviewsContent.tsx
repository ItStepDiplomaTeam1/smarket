import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchUserReviews } from '@/hooks/api/useReviewsApi';
import { apiClient } from '@/shared/api/apiClient';
import { ReviewCard } from './ReviewCard';
import { EmptyState } from './EmptyState';

import leftVector from '@/shared/assets/LeftVector.svg';
import rightVector from '@/shared/assets/RightVector.svg';

const REVIEWS_PER_PAGE = 6;

export function ReviewsContent() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: userReviews = [], isLoading, isError } = useFetchUserReviews(user?.id);

  const [activeTab, setActiveTab] = useState<'all' | 'drafts'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Завантажуємо інформацію про товари (назва, фото)
  const [productsMap, setProductsMap] = useState<Record<number, { title: string; image_url: string | null }>>({});

  useEffect(() => {
    if (userReviews.length === 0) return;

    const productIds = [...new Set(userReviews.map((r) => r.product_id))];
    const idsToFetch = productIds.filter((id) => !productsMap[id]);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      const results: Record<number, { title: string; image_url: string | null }> = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          const { data, status } = await apiClient.get(`/api/v1/products/${id}`, {
            validateStatus: (s) => s === 200 || s === 404,
          });
          if (status === 200 && data?.title) {
            results[id] = { title: data.title, image_url: data.image_url };
          } else {
            results[id] = { title: `Товар #${id}`, image_url: null };
          }
        })
      );
      if (!cancelled) {
        setProductsMap((prev) => ({ ...prev, ...results }));
      }
    })();
    return () => { cancelled = true; };
  }, [userReviews]);

  // Сортуємо відгуки
  const sortedReviews = useMemo(() => {
    const sorted = [...userReviews];
    sorted.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [userReviews, sortOrder]);

  // Пагінація
  const totalReviews = sortedReviews.length;
  const totalPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = Math.min(startIndex + REVIEWS_PER_PAGE, totalReviews);
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

  // Скидаємо на першу сторінку при зміні сортування
  useEffect(() => { setCurrentPage(1); }, [sortOrder]);

  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        
        {/* Хлібні крихти */}
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
          <span className="cursor-pointer hover:text-[#265447] transition-colors" onClick={() => navigate('/')}>Головна</span>
          <img src={rightVector} alt=">" className="w-[10px] h-[10px] object-contain mx-[2px]" />
          <span className="cursor-pointer hover:text-[#265447] transition-colors" onClick={() => navigate('/profile')}>Особистий кабінет</span>
          <img src={rightVector} alt=">" className="w-[10px] h-[10px] object-contain mx-[2px]" />
          <span className="text-[#265447] font-semibold">Відгуки</span>
        </div>

        {/* Заголовок */}
        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
          Мої відгуки
        </h1>

        {/* Таби */}
        <div className="flex gap-[32px] border-b border-[#265447]/[0.08] mb-[24px]">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-[12px] font-inter text-[14px] leading-[21.45px] transition-colors relative bg-transparent border-none cursor-pointer ${
              activeTab === 'all' 
                ? 'font-bold text-[#265447]' 
                : 'font-normal text-[#6D8279] hover:text-[#265447]'
            }`}
          >
            Всі відгуки
            {activeTab === 'all' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#6FE3C2] rounded-t-[2px]"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`pb-[12px] font-inter text-[14px] leading-[21.45px] transition-colors relative bg-transparent border-none cursor-pointer ${
              activeTab === 'drafts' 
                ? 'font-bold text-[#265447]' 
                : 'font-normal text-[#6D8279] hover:text-[#265447]'
            }`}
          >
            Чернетки
            {activeTab === 'drafts' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#6FE3C2] rounded-t-[2px]"></span>
            )}
          </button>
        </div>

        {/* Фільтри — показуємо тільки для вкладки "Всі відгуки" */}
        {activeTab === 'all' && (
          <div className="flex gap-[16px] mb-[24px]">
            <div className="w-[138px] h-[30px] border border-[#265447]/[0.16] rounded-[6px] px-[12px] flex items-center justify-between cursor-pointer bg-white">
              <span className="font-inter text-[10px] font-normal text-[#6D8279]">Всі категорії</span>
              <img src={rightVector} alt="v" className="w-[10px] h-[10px] object-contain rotate-90" />
            </div>
            <div 
              className="h-[30px] border border-[#265447]/[0.16] rounded-[6px] px-[12px] flex items-center justify-between cursor-pointer bg-white gap-[8px]"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <span className="font-inter text-[10px] font-normal text-[#6D8279] whitespace-nowrap">
                {sortOrder === 'newest' ? 'Сортування: нові спочатку' : 'Сортування: старі спочатку'}
              </span>
              <img src={rightVector} alt="v" className="w-[10px] h-[10px] object-contain rotate-90" />
            </div>
          </div>
        )}

        {/* --- Динамічний контент --- */}
        <div className="flex flex-col">
          
          {/* Стан завантаження */}
          {activeTab === 'all' && isLoading && (
            <div className="flex items-center justify-center py-[64px]">
              <svg className="animate-spin mr-[8px]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(38,84,71,0.2)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#265447" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="font-inter text-[14px] text-[#6D8279]">Завантаження відгуків...</span>
            </div>
          )}

          {/* Помилка */}
          {activeTab === 'all' && isError && (
            <div className="flex items-center gap-[8px] bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] px-[20px] py-[16px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-inter text-[14px] text-[#991B1B]">Не вдалося завантажити відгуки. Спробуйте оновити сторінку.</span>
            </div>
          )}

          {/* Вкладка "Всі відгуки" — реальні дані */}
          {activeTab === 'all' && !isLoading && !isError && (
            <>
              <div className="flex flex-col gap-[16px]">
                {paginatedReviews.length > 0 ? (
                  paginatedReviews.map((review) => {
                    const productInfo = productsMap[review.product_id];
                    return (
                      <ReviewCard
                        key={review.id}
                        reviewId={review.id}
                        rating={review.rating}
                        text={review.text}
                        createdAt={review.created_at}
                        productTitle={productInfo?.title || `Товар #${review.product_id}`}
                        productImage={productInfo?.image_url || null}
                      />
                    );
                  })
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Пагінація */}
              {totalReviews > 0 && (
                <div className="flex items-center justify-between mt-[24px]">
                  <span className="font-inter font-normal text-[14px] leading-[21.45px] text-[#6D8279]">
                    {startIndex + 1}-{endIndex} з {totalReviews} відгуків
                  </span>
                  <div className="flex items-center gap-[13px]">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`w-[30px] h-[30px] bg-white rounded-[6px] border border-[#265447]/[0.08] flex items-center justify-center transition-colors cursor-pointer ${
                        currentPage === 1 ? 'opacity-30 cursor-default' : 'hover:bg-[#F6FAF8]'
                      }`}
                    >
                      <img src={leftVector} alt="Попередня" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-[30px] h-[30px] rounded-[6px] flex items-center justify-center border-none cursor-pointer ${
                          page === currentPage
                            ? 'bg-[#6FE3C2] shadow-[0_4px_12px_rgba(23,59,51,0.06)]'
                            : 'bg-white border border-[#265447]/[0.08] hover:bg-[#F6FAF8]'
                        }`}
                      >
                        <span className={`font-manrope font-[800] text-[10px] ${
                          page === currentPage ? 'text-white' : 'text-[#265447]'
                        }`}>
                          {page}
                        </span>
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`w-[30px] h-[30px] bg-white rounded-[6px] border border-[#265447]/[0.08] flex items-center justify-center transition-colors cursor-pointer ${
                        currentPage === totalPages ? 'opacity-30 cursor-default' : 'hover:bg-[#F6FAF8]'
                      }`}
                    >
                      <img src={rightVector} alt="Наступна" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Вкладка "Чернетки" — заглушка */}
          {activeTab === 'drafts' && (
            <EmptyState />
          )}

        </div>

      </div>
    </section>
  );
}