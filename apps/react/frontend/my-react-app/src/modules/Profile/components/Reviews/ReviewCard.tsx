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
      <div className="w-full bg-white border border-[#6FE3C2] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] p-[24px] flex flex-col gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <div className="w-[44px] h-[56px] shrink-0 border border-[#265447]/[0.08] rounded-[5px] flex items-center justify-center overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={productTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#F6FAF8] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D8279" strokeWidth="1.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-inter text-[12px] font-medium text-[#265447] m-0 mb-[8px]">{productTitle}</h4>
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
          className="w-full h-[80px] border border-[#265447]/[0.16] rounded-[10px] px-[14px] py-[10px] font-inter text-[13px] text-[#173B33] resize-none outline-none focus:border-[#6FE3C2] transition-colors"
        />

        <div className="flex gap-[12px] justify-end">
          <button
            onClick={handleCancelEdit}
            className="h-[36px] px-[20px] bg-white border border-[#265447]/[0.16] rounded-[8px] font-inter text-[13px] font-semibold text-[#265447] cursor-pointer hover:bg-[#F6FAF8] transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={updateMutation.isPending}
            className="h-[36px] px-[20px] bg-[#265447] border-none rounded-[8px] font-inter text-[13px] font-semibold text-white cursor-pointer hover:bg-[#173B33] transition-colors disabled:opacity-50"
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
      <div className="w-full bg-white border border-[#FECACA] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] p-[24px] flex items-center justify-between">
        <div className="flex items-center gap-[12px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-inter text-[13px] text-[#173B33]">
            Ви впевнені, що хочете видалити цей відгук?
          </span>
        </div>
        <div className="flex gap-[12px]">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="h-[36px] px-[20px] bg-white border border-[#265447]/[0.16] rounded-[8px] font-inter text-[13px] font-semibold text-[#265447] cursor-pointer hover:bg-[#F6FAF8] transition-colors"
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
    <div className="w-full bg-white border border-[#265447]/[0.08] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] p-[24px] flex items-center justify-between relative">
      
      <div className="w-[44px] h-[56px] shrink-0 border border-[#265447]/[0.08] rounded-[5px] flex items-center justify-center overflow-hidden">
        {productImage ? (
          <img src={productImage} alt={productTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#F6FAF8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D8279" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[12px] w-[156px] shrink-0 ml-[16px]">
        <h4 className="font-inter text-[12px] font-medium text-[#265447] leading-none m-0">
          {productTitle}
        </h4>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= rating} />
          ))}
        </div>
      </div>

      <p className="flex-1 min-w-0 py-[6px] font-inter text-[12px] font-medium text-[#6D8279] leading-[18px] m-0 shrink-0 line-clamp-2 mx-[16px]">
        {text || 'Без коментаря'}
      </p>


      <span className="font-inter text-[12px] text-[#6D8279] shrink-0">
        {formatDate(createdAt)}
      </span>

      <div ref={menuRef} className="shrink-0 relative z-10 ml-[12px]">
        <div 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="cursor-pointer flex items-center justify-center w-[24px] h-[24px]"
        >
          <img src={kebabMenu} alt="Меню" className="w-[4px] h-[16px]" />
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-[32px] w-[184px] bg-white rounded-[10px] border border-[#265447]/[0.08] shadow-[0_8px_24px_rgba(23,59,51,0.12)] p-[12px] flex flex-col gap-[8px] z-20">
            
            <button
              onClick={() => { setIsEditing(true); setMenuOpen(false); }}
              className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] hover:bg-[#F6FAF8] transition-colors text-left bg-transparent border-none cursor-pointer"
            >
              <img src={editIcon} alt="Редагувати" className="w-[16px] h-[16px]" />
              <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-[#173B33]">
                Редагувати коментар
              </span>
            </button>
            
            <button
              onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
              className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] bg-[#FDC80D] hover:bg-[#F5C200] transition-colors text-left border-none cursor-pointer"
            >
              <img src={deleteIcon} alt="Видалити" className="w-[16px] h-[16px]" />
              <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-[#173B33]">
                Видалити
              </span>
            </button>

          </div>
        )}
      </div>

    </div>
  );
}