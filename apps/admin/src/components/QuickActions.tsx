import React from 'react';
import startIcon from '@/assets/QuickActions/Start.svg';
import stopIcon from '@/assets/QuickActions/Stop.svg';

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-manrope text-lg font-bold !text-[#265447]">Швидкі дії</h3>
      <div className="border-b border-border my-3" />
      
      <div className="grid grid-cols-2 gap-3">
        <button className="h-[54px] flex items-center gap-3 px-5 rounded-2xl border-2 border-[#008C5E] bg-[#EBF6F1]/70 hover:bg-[#EBF6F1]/90 transition-colors group">
          <img src={startIcon} alt="Запустити" className="h-[28px] w-auto object-contain shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-left leading-tight !text-[#008C5E]">
            Запустити<br/>всі парсери
          </span>
        </button>
        
        <button className="h-[54px] flex items-center gap-3 px-5 rounded-2xl border-2 border-[#FDC80D] bg-[#FFFBEB]/70 hover:bg-[#FFFBEB]/90 transition-colors group">
          <img src={stopIcon} alt="Зупинити" className="h-[28px] w-auto object-contain shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-left leading-tight !text-[#FDC80D]">
            Зупинити<br/>всі парсери
          </span>
        </button>
      </div>
    </div>
  );
};
