import { useState, useRef, useEffect } from 'react';
import { useDeleteReview, useUpdateReview } from '@/hooks/api/useReviewsApi';

import editIcon from '@/shared/assets/redact_reviews.svg';
import deleteIcon from '@/shared/assets/delete_reviews.svg';
import goldStar from '@/shared/assets/gold-star.svg';
import emptyStar from '@/shared/assets/starforreviews.svg';
import kebabMenu from '@/shared/assets/Default.svg';

const StarIcon = ({ filled, onClick }: { filled: boolean; onClick?: () => void }) => (
  <img
    src={filled ? goldStar : emptyStar}
    alt={filled ? "Filled Star" : "Empty Star"}
    className={`w-[21px] h-[21px] shrink-0 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  />
);

function formatDate(iso: string): string {
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
  ];
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface ReviewCardProps {
  reviewId: string;
  rating: number;
  text: string | null;
  createdAt: string;
  productTitle: string;
  productImage: string | null;
}

export function ReviewCard({ reviewId, rating, text, createdAt, productTitle, productImage }: ReviewCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(rating);
  const [editText, setEditText] = useState(text || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const deleteMutation = useDeleteReview();
  const updateMutation = useUpdateReview();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDelete = () => {
    deleteMutation.mutate(reviewId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setMenuOpen(false);
      },
    });
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(
      { reviewId, rating: editRating, text: editText || null },
      {
        onSuccess: () => {
          setIsEditing(false);
          setMenuOpen(false);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditRating(rating);
    setEditText(text || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="w-full bg-[#1C2723] border border-[#265447]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] p-[24px] flex flex-col gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <div className="w-[56px] h-[56px] shrink-0 border border-[#265447]/30 rounded-[5px] flex items-center justify-center overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={productTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#111A17] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-inter text-[12px] font-medium text-white m-0 mb-[8px]">{productTitle}</h4>
            <div className="flex gap-[2px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} filled={star <= editRating} onClick={() => setEditRating(star)} />
              ))}
            </div>
          </div>
        </div>

        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Напишіть свій відгук..."
          className="w-full h-[80px] border border-[#265447]/30 rounded-[10px] px-[14px] py-[10px] font-inter text-[13px] bg-[#111A17] text-white resize-none outline-none focus:border-[#3DAE8B] transition-colors placeholder:text-[#94A3B8]/30"
        />

        <div className="flex gap-[12px] justify-end">
          <button
            onClick={handleCancelEdit}
            className="h-[36px] px-[20px] bg-[#1C2723] border border-[#265447]/30 rounded-[8px] font-inter text-[13px] font-semibold text-[#94A3B8] cursor-pointer hover:bg-[#173B33] transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={updateMutation.isPending}
            className="h-[36px] px-[20px] bg-[#3DAE8B] border-none rounded-[8px] font-inter text-[13px] font-semibold text-[#111A17] cursor-pointer hover:bg-[#2E9B78] transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>

        {updateMutation.isError && (
          <p className="font-inter text-[12px] text-[#EF4444] m-0">Помилка збереження. Спробуйте ще раз.</p>
        )}
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="w-full bg-[#2D1515] border border-[#EF4444]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] p-[24px] flex items-center justify-between">
        <div className="flex items-center gap-[12px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-inter text-[13px] text-white">
            Ви впевнені, що хочете видалити цей відгук?
          </span>
        </div>
        <div className="flex gap-[12px]">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="h-[36px] px-[20px] bg-[#1C2723] border border-[#265447]/30 rounded-[8px] font-inter text-[13px] font-semibold text-[#94A3B8] cursor-pointer hover:bg-[#173B33] transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-[36px] px-[20px] bg-[#EF4444] border-none rounded-[8px] font-inter text-[13px] font-semibold text-white cursor-pointer hover:bg-[#DC2626] transition-colors disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1C2723] border border-[#265447]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-[16px] p-[16px] sm:p-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] sm:gap-0 relative">
      
      {/* Ліві дані: Фото + Назва + Зірочки */}
      <div className="flex items-center gap-[12px] w-full sm:w-auto min-w-0 pr-[24px] sm:pr-0">
        <div className="w-[56px] h-[56px] shrink-0 border border-[#265447]/30 rounded-[5px] flex items-center justify-center overflow-hidden bg-white p-[2px]">
          {productImage ? (
            <img src={productImage} alt={productTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#111A17] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[8px] min-w-0 flex-1 sm:w-[156px] sm:shrink-0 sm:ml-[16px]">
          <h4 className="font-inter text-[12px] font-medium text-white leading-tight m-0 line-clamp-2 sm:truncate">
            {productTitle}
          </h4>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= rating} />
            ))}
          </div>
        </div>
      </div>

      {/* Сам відгук */}
      <p className="w-full sm:flex-1 py-[4px] sm:py-[6px] font-inter text-[12px] font-medium text-[#94A3B8] leading-[18px] m-0 line-clamp-3 sm:line-clamp-2 sm:mx-[16px]">
        {text || 'Без коментаря'}
      </p>

      {/* Дата */}
      <span className="font-inter text-[12px] text-[#94A3B8] shrink-0 self-end sm:self-auto">
        {formatDate(createdAt)}
      </span>

      {/* Кнопка три крапки */}
      <div ref={menuRef} className="absolute top-[16px] right-[16px] sm:static sm:ml-[12px] shrink-0 z-10">
        <div 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="cursor-pointer flex items-center justify-center w-[24px] h-[24px]"
        >
          <img src={kebabMenu} alt="Меню" className="w-[4px] h-[16px] brightness-0 invert" />
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-[32px] w-[184px] bg-[#111A17] rounded-[10px] border border-[#265447]/50 shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-[12px] flex flex-col gap-[8px] z-20">
            
            <button
              onClick={() => { setIsEditing(true); setMenuOpen(false); }}
              className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] hover:bg-white/5 transition-colors text-left bg-transparent border-none cursor-pointer"
            >
              <img src={editIcon} alt="Редагувати" className="w-[16px] h-[16px] brightness-0 invert" />
              <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-white">
                Редагувати коментар
              </span>
            </button>
            
            <button
              onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
              className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] bg-[#FACC14] hover:bg-[#E2B007] transition-colors text-left border-none cursor-pointer"
            >
              <img src={deleteIcon} alt="Видалити" className="w-[16px] h-[16px]" />
              <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-[#111A17]">
                Видалити
              </span>
            </button>
 
          </div>
        )}
      </div>

    </div>
  );
}