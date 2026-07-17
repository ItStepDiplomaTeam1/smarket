import { useState } from 'react';
import { useFetchProductReviews, useDeleteReview } from '@/hooks/api/useReviewsApi';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { ReviewModal } from './ReviewModal';
import goldstar from '@/shared/assets/gold-star.svg';
import zero_star from '@/shared/assets/star-for-review.svg';

const ReviewStars = ({ filled, size = 12 }: { filled: number; size?: number }) => (
    <div className="flex gap-[2px]">
        {[0, 1, 2, 3, 4].map(i => (
            <img
                key={i}
                src={i < filled ? goldstar : zero_star}
                alt="star"
                style={{ width: size, height: size }}
            />
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

    const { data: reviews = [], isLoading, isError } = useFetchProductReviews(productId);
    const deleteReview = useDeleteReview();

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
        <section className="w-full bg-[#F6FAF8] dark:bg-[#111A17] font-inter transition-colors">
            <div className="w-full max-w-[1180px] mx-auto pt-[32px] pb-[40px] px-[24px]">

                <h2 className="font-manrope font-[200] text-[24px] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[24px]">
                    Відгуки покупців
                </h2>

                {/* Стан завантаження */}
                {isLoading && (
                    <div className="flex items-center justify-center py-[40px]">
                        <svg className="animate-spin mr-[8px]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(38,84,71,0.2)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#265447" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="text-[14px] text-[#6D8279] dark:text-[#A9B6B0]">Завантаження відгуків...</span>
                    </div>
                )}

                {/* Помилка завантаження */}
                {isError && (
                    <div className="flex items-center gap-[8px] bg-[#FEF2F2] dark:bg-[#FEF2F2]/10 border border-[#FECACA] dark:border-[#FECACA]/30 rounded-[12px] px-[20px] py-[16px] mb-[24px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-[14px] text-[#991B1B] dark:text-red-400">Не вдалося завантажити відгуки. Спробуйте оновити сторінку.</span>
                    </div>
                )}

                {/* Контент — показуємо тільки якщо завантажено */}
                {!isLoading && !isError && (
                    <>
                        {/* Картка загального рейтингу */}
                        {reviews.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 rounded-[16px] p-[24px] mb-[24px] shadow-sm gap-[16px] sm:gap-0 transition-colors">
                                <div className="font-manrope font-[200] text-[32px] leading-[48px] text-[#265447] dark:text-[#3DAE8B] mr-[16px]">
                                    {avgRatingDisplay}
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <ReviewStars filled={filledStarsAvg} size={16} />
                                    <div className="font-inter font-normal text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0]">
                                        На основі {reviews.length} {reviews.length === 1 ? 'відгуку' : reviews.length < 5 ? 'відгуків' : 'відгуків'}
                                    </div>
                                </div>
                                {avgRating >= 4.0 && (
                                    <span className="inline-flex items-center justify-center h-[26px] px-[12px] bg-[#EAF7F2] dark:bg-[#EAF7F2]/10 rounded-[16px] sm:ml-[32px] font-inter font-semibold text-[12px] leading-[18px] text-[#265447] dark:text-[#3DAE8B]">
                                        Покупці рекомендують цей товар
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Пустий стан */}
                        {reviews.length === 0 && (
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 rounded-[16px] p-[40px] mb-[24px] shadow-sm transition-colors">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p className="font-manrope font-semibold text-[16px] text-[#265447] dark:text-[#3DAE8B] m-0 mb-[4px]">
                                    Ще немає відгуків
                                </p>
                                <p className="font-inter text-[14px] text-[#6D8279] dark:text-[#A9B6B0] m-0">
                                    Будьте першим, хто залишить відгук про цей товар!
                                </p>
                            </div>
                        )}

                        {/* Картки відгуків */}
                        {reviews.length > 0 && (
                            <div className="flex flex-col gap-[16px] mb-[32px]">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 rounded-[16px] p-[24px] bg-white dark:bg-[#1D2A25]
                                                   transition-all duration-200 hover:shadow-[0_2px_12px_rgba(23,59,51,0.06)] shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-[12px] gap-[8px] sm:gap-0">
                                            <div className="flex flex-col gap-[4px]">
                                                <div className="flex items-center gap-[8px]">
                                                    <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#265447] dark:text-[#3DAE8B] m-0">
                                                        {review.user_name}
                                                    </span>
                                                    {/* Позначка, якщо це відгук поточного користувача */}
                                                    {user && user.id === review.user_id && (
                                                        <span className="inline-flex items-center h-[20px] px-[8px] bg-[#EAF7F2] dark:bg-[#EAF7F2]/10 rounded-[10px] font-inter font-semibold text-[10px] text-[#265447] dark:text-[#3DAE8B]">
                                                            Ваш відгук
                                                        </span>
                                                    )}
                                                </div>
                                                <ReviewStars filled={review.rating} />
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-[12px]">
                                                <span className="font-inter font-normal text-[13px] leading-[19.5px] text-[#6D8279] dark:text-[#A9B6B0]">
                                                    {formatDate(review.created_at)}
                                                </span>
                                                {/* Кнопка видалення (тільки для власних відгуків) */}
                                                {user && user.id === review.user_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(review.id)}
                                                        disabled={deleteReview.isPending}
                                                        className="w-[28px] h-[28px] flex items-center justify-center bg-transparent border-none cursor-pointer
                                                                   rounded-full text-[#9CA3AF] transition-colors duration-200
                                                                   hover:bg-[#FEF2F2] dark:hover:bg-[#FEF2F2]/10 hover:text-[#EF4444]
                                                                   disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            <p className="font-inter font-normal text-[16px] leading-[24px] text-[#6D8279] dark:text-[#EAF7F2] m-0">
                                                {review.text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Футер з кнопкою */}
                        <div className="flex items-center gap-[16px]">
                            <button
                                id="btn-write-review"
                                type="button"
                                onClick={() => {
                                    if (isAuthenticated) {
                                        setIsModalOpen(true);
                                    }
                                }}
                                className={`w-[181px] h-[46px] flex justify-center items-center rounded-[10px] border
                                           font-inter font-semibold text-[14px] cursor-pointer transition-all duration-200 shadow-sm
                                           ${isAuthenticated
                                               ? 'bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] border-[#265447] dark:border-[#3DAE8B] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C]'
                                               : 'bg-white dark:bg-[#111A17] text-[#265447] dark:text-[#3DAE8B] border-[rgba(38,84,71,0.16)] dark:border-[#265447]/30 opacity-60 cursor-not-allowed'
                                           }`}
                                disabled={!isAuthenticated}
                            >
                                Написати відгук
                            </button>
                            {!isAuthenticated && (
                                <span className="font-inter font-normal text-[14px] leading-[21px] text-[#6D8279]">
                                    Увійдіть в акаунт, щоб залишити відгук.
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Модальне вікно створення відгуку */}
            <ReviewModal
                productId={productId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
}
