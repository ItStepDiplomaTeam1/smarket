import React from 'react';

// Імпортуємо вашу іконку
import basketIcon from '@/shared/assets/basketforreviews.svg';

export function EmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center pt-[60px] pb-[80px]">
      
      <img 
        src={basketIcon} 
        alt="Порожньо" 
        className="w-[88px] h-[88px] mb-[12px] object-contain" 
      />
      
      {/* Заголовок */}
      <h3 className="font-manrope text-[20px] font-bold text-[#173B33] leading-[30px] m-0 mb-[8px] text-center">
        Порожній стан
      </h3>
      
      {/* Підзаголовок */}
      <p className="font-inter text-[14px] font-medium text-[#6D8279] leading-[21px] m-0 mb-[24px] text-center">
        У вас ще немає відгуків
      </p>

      {/* Кнопки */}
      <div className="flex items-center gap-[16px]">
        <button className="w-[155px] h-[44px] bg-[#265447] rounded-[10px] flex items-center justify-center font-inter text-[14px] font-semibold text-white transition-colors hover:bg-[#173B33]">
          Створити кошик
        </button>
        <button className="w-[163px] h-[44px] bg-white border border-[#265447]/[0.16] rounded-[10px] flex items-center justify-center font-inter text-[14px] font-semibold text-[#265447] transition-colors hover:bg-[#F6FAF8]">
          Перейти в каталог
        </button>
      </div>

    </div>
  );
}