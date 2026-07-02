import { useState } from 'react';

// Імпорти іконок
import editIcon from '@/shared/assets/redact_reviews.svg';
import deleteIcon from '@/shared/assets/delete_reviews.svg';
import goldStar from '@/shared/assets/gold-star.svg';
import emptyStar from '@/shared/assets/starforreviews.svg';
import kebabMenu from '@/shared/assets/Default.svg';

const StarIcon = ({ filled }: { filled: boolean }) => (
  <img 
    src={filled ? goldStar : emptyStar} 
    alt={filled ? "Filled Star" : "Empty Star"} 
    className="w-[21px] h-[21px] shrink-0"
  />
);

export function ReviewCard() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // Головний контейнер з justify-between (всі 5 елементів тепер прямі нащадки)
    <div className="w-full bg-white border border-[#265447]/[0.08] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] p-[24px] flex items-center justify-between relative">
      
      {/* 1. Зображення */}
      <div className="w-[44px] h-[56px] shrink-0 border border-[#265447]/[0.08] rounded-[5px] flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-[#E5002B]"></div> 
      </div>

      {/* 2. Заголовок та зірки */}
      <div className="flex flex-col gap-[12px] w-[156px] shrink-0">
        <h4 className="font-inter text-[12px] font-medium text-[#265447] leading-none m-0">
          Шоколад молочний Lindt Lindor 100 г
        </h4>
        <div className="flex">
          <StarIcon filled={true} />
          <StarIcon filled={false} />
          <StarIcon filled={false} />
          <StarIcon filled={false} />
          <StarIcon filled={false} />
        </div>
      </div>

      {/* 3. Текст відгуку */}
      <p className="w-[493px] py-[6px] font-inter text-[12px] font-medium text-[#6D8279] leading-none m-0 shrink-0 line-clamp-2">
        Взагалі не сподобався, 5 складів на 1 місці цукор, на 2 пальмова олія, какао дуже мало, не смак
      </p>

      {/* 4. Дата */}
      <span className="font-inter text-[12px] text-[#6D8279] shrink-0">
        10 червня 2026
      </span>

      {/* 5. Кнопка меню */}
      <div 
        onClick={() => setMenuOpen(!menuOpen)} 
        className="shrink-0 relative z-10 cursor-pointer flex items-center justify-center w-[24px] h-[24px]"
      >
        <img src={kebabMenu} alt="Меню" className="w-[4px] h-[16px]" />
      </div>

      {menuOpen && (
        <div className="absolute right-[40px] top-[40px] w-[184px] bg-white rounded-[10px] border border-[#265447]/[0.08] shadow-[0_8px_24px_rgba(23,59,51,0.12)] p-[12px] flex flex-col gap-[8px] z-20">
          
          <button className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] hover:bg-[#F6FAF8] transition-colors text-left bg-transparent border-none cursor-pointer">
            <img src={editIcon} alt="Редагувати" className="w-[16px] h-[16px]" />
            <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-[#173B33]">
              Редагувати коментар
            </span>
          </button>
          
          <button className="w-full h-[30px] flex items-center gap-[12px] px-[12px] rounded-[4px] bg-[#FDC80D] hover:bg-[#F5C200] transition-colors text-left border-none cursor-pointer">
            <img src={deleteIcon} alt="Видалити" className="w-[16px] h-[16px]" />
            <span className="font-inter font-semibold text-[12px] leading-[18.2px] text-[#173B33]">
              Видалити
            </span>
          </button>

        </div>
      )}

    </div>
  );
}