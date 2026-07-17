import React from 'react';

// Імпортуємо вашу іконку
import basketIcon from '@/shared/assets/basketforreviews.svg';

export function EmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center pt-[60px] pb-[80px]">
      
      <img 
        src={basketIcon} 
        alt="Порожньо" 
        className="w-[88px] h-[88px] mb-[12px] object-contain dark:brightness-125" 
      />
      
      {/* Заголовок */}
      <h3 className="font-manrope text-[20px] font-bold text-[#173B33] dark:text-white leading-[30px] m-0 mb-[8px] text-center">
        Порожній стан
      </h3>
      
      {/* Підзаголовок */}
      <p className="font-inter text-[14px] font-medium text-[#6D8279] dark:text-[#A9B6B0] leading-[21px] m-0 mb-[24px] text-center">
        У вас ще немає відгуків
      </p>

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row items-center gap-[16px] w-full sm:w-auto">
        <button className="w-[155px] h-[44px] bg-[#265447] dark:bg-[#3DAE8B] rounded-[10px] flex items-center justify-center font-inter text-[14px] font-semibold text-white dark:text-[#111A17] transition-colors hover:bg-[#173B33] dark:hover:bg-[#2C9E7C] shadow-sm">
          Створити кошик
        </button>
        <button className="w-[163px] h-[44px] bg-white dark:bg-[#1D2A25] border border-[#265447]/[0.16] dark:border-[#265447]/30 rounded-[10px] flex items-center justify-center font-inter text-[14px] font-semibold text-[#265447] dark:text-[#EAF7F2] transition-colors hover:bg-[#F6FAF8] dark:hover:bg-[#1C2723] shadow-sm">
          Перейти в каталог
        </button>
      </div>

    </div>
  );
}