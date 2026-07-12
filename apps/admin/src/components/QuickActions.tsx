import React from 'react';
import startIcon from '@/assets/QuickActions/Start.svg';
import stopIcon from '@/assets/QuickActions/Stop.svg';
import { useUiStore } from '@/store/useUiStore';

export const QuickActions: React.FC = () => {
  const isDarkMode = useUiStore((state) => state.isDarkMode);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-manrope text-lg font-bold text-textMain">Швидкі дії</h3>
      <div className="border-b border-border my-3" />
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          className={`h-[54px] flex items-center gap-3 px-5 rounded-2xl border-2 border-[#008C5E] transition-colors group ${
            isDarkMode 
              ? 'bg-[#008C5E] hover:bg-[#008C5E]/90' 
              : 'bg-[#EBF6F1]/70 hover:bg-[#EBF6F1]/90'
          }`}
        >
          <img 
            src={startIcon} 
            alt="Запустити" 
            className="h-[28px] w-auto object-contain shrink-0" 
            style={isDarkMode ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
          <span 
            className={`text-xs sm:text-sm font-bold text-left leading-tight ${
              isDarkMode ? 'text-white' : 'text-[#008C5E]'
            }`}
          >
            Запустити<br/>всі парсери
          </span>
        </button>
        
        <button 
          className={`h-[54px] flex items-center gap-3 px-5 rounded-2xl border-2 border-[#FDC80D] transition-colors group ${
            isDarkMode 
              ? 'bg-[#FDC80D] hover:bg-[#FDC80D]/90' 
              : 'bg-[#FFFBEB]/70 hover:bg-[#FFFBEB]/90'
          }`}
        >
          <img 
            src={stopIcon} 
            alt="Зупинити" 
            className="h-[28px] w-auto object-contain shrink-0" 
            style={isDarkMode ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
          <span 
            className={`text-xs sm:text-sm font-bold text-left leading-tight ${
              isDarkMode ? 'text-white' : 'text-[#FDC80D]'
            }`}
          >
            Зупинити<br/>всі парсери
          </span>
        </button>
      </div>
    </div>
  );
};
