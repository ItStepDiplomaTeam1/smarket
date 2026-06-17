import { useState } from 'react';
import { useCreateReview } from '@/hooks/api/useReviewsApi';

// -------------------------------------------------------
//  Інтерактивний вибір рейтингу (зірочки з hover-ефектом)
// -------------------------------------------------------

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-[4px]" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className="bg-transparent border-none cursor-pointer p-0 transition-transform duration-150 hover:scale-110"
            aria-label={`Оцінка ${star}`}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill={isFilled ? '#F59E0B' : 'none'}
              stroke={isFilled ? '#F59E0B' : '#9CA3AF'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-150"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
//  Модальне вікно створення відгуку
// -------------------------------------------------------

interface ReviewModalProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ productId, isOpen, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const createReview = useCreateReview();

  // Скидаємо форму при закритті
  const handleClose = () => {
    setRating(0);
    setText('');
    setShowSuccess(false);
    createReview.reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) return;

    createReview.mutate(
      {
        product_id: productId,
        rating,
        text: text.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          // Автоматично закриваємо через 1.5 секунди
          setTimeout(() => {
            handleClose();
          }, 1500);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[8px] flex items-center justify-center font-inter"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Modal card */}
      <div
        className="relative w-[480px] max-w-[90vw] bg-white rounded-[24px] p-[40px] shadow-[0px_18px_48px_rgba(23,59,51,0.12)]
                    animate-[modalSlideIn_0.25s_ease-out]"
      >
        {/* Кнопка закриття */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-[16px] right-[16px] w-[32px] h-[32px] flex items-center justify-center
                     bg-transparent border-none cursor-pointer rounded-full text-[#6D8279]
                     transition-colors duration-200 hover:bg-[#F3F4F6] hover:text-[#265447]"
          aria-label="Закрити"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Success стан */}
        {showSuccess ? (
          <div className="flex flex-col items-center gap-[16px] py-[24px]">
            <div className="w-[56px] h-[56px] bg-[#EAF7F2] rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#265447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-manrope font-semibold text-[18px] text-[#265447] m-0">
              Дякуємо за відгук!
            </p>
            <p className="font-inter text-[14px] text-[#6D8279] m-0">
              Ваш відгук успішно додано
            </p>
          </div>
        ) : (
          <>
            {/* Заголовок */}
            <h2 className="font-manrope font-[700] text-[24px] leading-[36px] text-[#265447] m-0 mb-[8px]">
              Написати відгук
            </h2>
            <p className="font-inter text-[14px] leading-[21px] text-[#6D8279] m-0 mb-[24px]">
              Поділіться вашими враженнями про цей товар
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Рейтинг */}
              <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">
                Оцінка <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mb-[20px]">
                <StarRating value={rating} onChange={setRating} />
                {rating === 0 && createReview.isError && (
                  <p className="text-[12px] text-[#EF4444] mt-[4px] m-0">
                    Будь ласка, оберіть оцінку
                  </p>
                )}
              </div>

              {/* Текст відгуку */}
              <label htmlFor="review-text" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">
                Ваш коментар
              </label>
              <textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Розкажіть, що вам сподобалось або не сподобалось..."
                rows={4}
                maxLength={1000}
                className="w-full border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] py-[12px] mb-[8px]
                           bg-white font-inter text-[14px] text-[#111827] outline-none resize-none
                           transition-colors duration-200 focus:border-[#265447]
                           placeholder:text-[#9CA3AF]"
              />
              <span className="text-[12px] text-[#9CA3AF] mb-[24px] self-end">
                {text.length} / 1000
              </span>

              {/* Помилка */}
              {createReview.isError && (
                <div className="flex items-center gap-[8px] bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-[16px] py-[12px] mb-[16px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p className="text-[13px] text-[#991B1B] m-0">
                    Не вдалося надіслати відгук. Спробуйте ще раз.
                  </p>
                </div>
              )}

              {/* Кнопка надіслати */}
              <button
                type="submit"
                disabled={rating === 0 || createReview.isPending}
                className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer
                           font-inter text-[14px] font-bold transition-all duration-200
                           hover:bg-[#1A3E2F]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-[8px]"
              >
                {createReview.isPending ? (
                  <>
                    {/* Спіннер */}
                    <svg
                      className="animate-spin"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Надсилається...
                  </>
                ) : (
                  'Надіслати відгук'
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Анімація появи модалки */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
