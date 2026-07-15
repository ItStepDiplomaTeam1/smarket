import { useState, useRef, useEffect } from 'react';
import { useFetchProductReviews, useDeleteReview } from '@/hooks/api/useReviewsApi';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { ReviewModal } from './ReviewModal';
import goldstar from '@/shared/assets/gold-star.svg';
import zero_star from '@/shared/assets/star-for-review.svg';

const ReviewStars = ({ filled, size = 12 }: { filled: number; size?: number }) => (
    <div className="flex gap-[2px]">
        {[0, 1, 2, 3, 4].map(i => (
            <img key={i} src={i < filled ? goldstar : zero_star} alt="star" style={{ width: size, height: size }} />
        ))}
    </div>
);

const MONTHS_UA = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

function formatDate(iso: string): string {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${MONTHS_UA[d.getMonth()]} ${d.getFullYear()}`;
}

interface ReviewsProps {
    productId: number;
}

export function Reviews({ productId }: ReviewsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); } },
            { threshold: 0.05 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const { data: reviews = [], isLoading, isError } = useFetchProductReviews(productId);
    const deleteReview = useDeleteReview(productId);
    const { user, isAuthenticated } = useAuthStore();

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
        : 0;
    const avgRatingDisplay = avgRating.toFixed(1);
    const filledStarsAvg = Math.round(avgRating);

    const handleDelete = (reviewId: string) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей відгук?')) {
            deleteReview.mutate(reviewId);
        }
    };

    return (
        <section ref={sectionRef} className="scroll-observe w-full bg-[#111A17] font-inter">
            <div className="w-full max-w-[1180px] mx-auto pt-[32px] pb-[32px] px-[20px] sm:px-[24px]">

                <h2 className="font-manrope font-[200] text-[24px] leading-[31.2px] text-white m-0 mb-[24px]">
                    Відгуки покупців
                </h2>

                {/* Завантаження */}
                {isLoading && (
                    <div className="flex items-center justify-center py-[40px]">
                        <svg className="animate-spin mr-[8px]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(61,174,139,0.2)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#3DAE8B" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="text-[14px] text-[#94A3B8]">Завантаження відгуків...</span>
                    </div>
                )}

                {/* Помилка */}
                {isError && (
                    <div className="flex items-center gap-[8px] bg-[#2D1515] border border-[#EF4444]/30 rounded-[12px] px-[20px] py-[16px] mb-[24px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-[14px] text-[#EF4444]">Не вдалося завантажити відгуки. Спробуйте оновити сторінку.</span>
                    </div>
                )}

                {!isLoading && !isError && (
                    <>
                        {/* Загальний рейтинг */}
                        {reviews.length > 0 && (
                            <div className="review-header flex flex-wrap items-center bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[24px] mb-[24px] gap-[16px]">
                                <div className="font-manrope font-[200] text-[32px] leading-[48px] text-[#3DAE8B] mr-[16px]">
                                    {avgRatingDisplay}
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <ReviewStars filled={filledStarsAvg} size={16} />
                                    <div className="font-inter font-normal text-[14px] leading-[21px] text-[#94A3B8]">
                                        На основі {reviews.length} {reviews.length === 1 ? 'відгуку' : 'відгуків'}
                                    </div>
                                </div>
                                {avgRating >= 4.0 && (
                                    <span className="inline-flex items-center justify-center h-[26px] px-[12px] bg-[#173B33] rounded-[16px] ml-auto font-inter font-semibold text-[12px] text-[#3DAE8B]">
                                        Покупці рекомендують цей товар
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Пустий стан */}
                        {reviews.length === 0 && (
                            <div className="flex flex-col items-center justify-center bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[40px] mb-[24px]">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#265447" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p className="font-manrope font-semibold text-[16px] text-[#3DAE8B] m-0 mb-[4px]">
                                    Ще немає відгуків
                                </p>
                                <p className="font-inter text-[14px] text-[#94A3B8] m-0">
                                    Будьте першим, хто залишить відгук про цей товар!
                                </p>
                            </div>
                        )}

                        {/* Карточки відгуків */}
                        {reviews.length > 0 && (
                            <div className="flex flex-col gap-[16px] mb-[32px]">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="border border-[#265447]/8 rounded-[16px] p-[20px] sm:p-[24px] bg-[#1C2723] transition-all duration-200 hover:border-[#265447]/30"
                                    >
                                        <div className="review-card-header flex flex-wrap justify-between items-start mb-[12px] gap-[8px]">
                                            <div className="flex flex-col gap-[4px]">
                                                <div className="flex items-center gap-[8px]">
                                                    <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#3DAE8B] m-0">
                                                        {review.user_name}
                                                    </span>
                                                    {user && user.id === review.user_id && (
                                                        <span className="inline-flex items-center h-[20px] px-[8px] bg-[#173B33] rounded-[10px] font-inter font-semibold text-[10px] text-[#3DAE8B]">
                                                            Ваш відгук
                                                        </span>
                                                    )}
                                                </div>
                                                <ReviewStars filled={review.rating} />
                                            </div>
                                            <div className="flex items-center gap-[12px]">
                                                <span className="font-inter font-normal text-[13px] leading-[19.5px] text-white">
                                                    {formatDate(review.created_at)}
                                                </span>
                                                {user && user.id === review.user_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(review.id)}
                                                        disabled={deleteReview.isPending}
                                                        className="w-[28px] h-[28px] flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full text-[#94A3B8] transition-colors duration-200 hover:bg-[#EF4444]/10 hover:text-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label="Видалити відгук"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {review.text && (
                                            <p className="font-inter font-normal text-[16px] leading-[24px] text-white/70 m-0">
                                                {review.text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Кнопка написати відгук */}
                        <div className="flex flex-wrap items-center gap-[12px] sm:gap-[16px]">
                            <button
                                id="btn-write-review"
                                type="button"
                                onClick={() => { if (isAuthenticated) setIsModalOpen(true); }}
                                className={`min-w-[160px] h-[48px] flex justify-center items-center rounded-[10px] border font-inter font-semibold text-[14px] cursor-pointer transition-all duration-200 active:scale-[0.97] ${
                                    isAuthenticated
                                        ? 'bg-[#3DAE8B] text-[#111A17] border-[#3DAE8B] hover:bg-[#2E9B78]'
                                        : 'bg-transparent text-[#3DAE8B] border-[#265447]/40 opacity-60 cursor-not-allowed'
                                }`}
                                disabled={!isAuthenticated}
                            >
                                Написати відгук
                            </button>
                            {!isAuthenticated && (
                                <span className="font-inter font-normal text-[14px] leading-[21px] text-white">
                                    Увійдіть в акаунт, щоб залишити відгук після покупки.
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ReviewModal productId={productId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
}
