import React, { useState } from 'react';
import { useEtlStatus, useEtlControl } from '@/hooks/useEtlControl';
import { toast } from 'react-hot-toast';

import startIcon from '@/assets/QuickActions/Start.svg';
import stopIcon from '@/assets/QuickActions/Stop.svg';
import { useUiStore } from '@/store/useUiStore';

export const QuickActions: React.FC = () => {
  const isDarkMode = useUiStore((state) => state.isDarkMode);
  
  const { data: etlHealth, isLoading: statusLoading } = useEtlStatus();
  const etlControl = useEtlControl();
  const [activeAction, setActiveAction] = useState<'start' | 'stop' | null>(null);

  const isRunning = etlHealth?.etl_running ?? true; // Default to true if unknown

  const handleAction = (action: 'start' | 'stop') => {
    setActiveAction(action);
    etlControl.mutate(action, {
      onSuccess: () => {
        toast.success(
          action === 'start' 
            ? 'ETL парсери успішно запущено' 
            : 'ETL парсери зупинено'
        );
        setActiveAction(null);
      },
      onError: (err: any) => {
        const errorDetail = err.response?.data?.detail || err.message || 'Невідома помилка';
        toast.error(`Помилка: ${errorDetail}`);
        setActiveAction(null);
      }
    });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-manrope text-lg font-bold text-textMain">Швидкі дії</h3>
      <div className="border-b border-border my-3" />
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => handleAction('start')}
          disabled={etlControl.isPending || isRunning || statusLoading}
          className={`h-[54px] w-full flex items-center justify-start gap-1.5 pl-2.5 pr-1.5 rounded-2xl border-2 transition-colors group relative
            ${isRunning 
              ? 'border-[#008C5E] bg-[#008C5E] cursor-default' // Active state
              : (isDarkMode ? 'border-[#008C5E] bg-[#008C5E]/70 hover:bg-[#008C5E]/90' : 'border-[#008C5E] bg-[#EBF6F1]/70 hover:bg-[#EBF6F1]/90')
            }
            ${etlControl.isPending || statusLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {activeAction === 'start' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
          ) : (
            <>
              <img 
                src={startIcon} 
                alt="Запустити" 
                className="h-[22px] w-auto object-contain shrink-0" 
                style={isRunning || isDarkMode ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
              <span 
                className={`flex-1 min-w-0 text-[11px] md:text-xs xl:text-[11px] 2xl:text-xs font-bold text-left leading-tight
                  ${isRunning ? 'text-white' : (isDarkMode ? 'text-white' : 'text-[#008C5E]')}
                `}
              >
                Запустити парсер
              </span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => handleAction('stop')}
          disabled={etlControl.isPending || !isRunning || statusLoading}
          className={`h-[54px] w-full flex items-center justify-start gap-1.5 pl-2.5 pr-1.5 rounded-2xl border-2 transition-colors group relative
            ${!isRunning 
              ? 'border-[#FDC80D] bg-[#FDC80D] cursor-default' // Active state
              : (isDarkMode ? 'border-[#FDC80D] bg-[#FDC80D]/70 hover:bg-[#FDC80D]/90' : 'border-[#FDC80D] bg-[#FFFBEB]/70 hover:bg-[#FFFBEB]/90')
            }
            ${etlControl.isPending || statusLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {activeAction === 'stop' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
          ) : (
            <>
              <img 
                src={stopIcon} 
                alt="Зупинити" 
                className="h-[22px] w-auto object-contain shrink-0" 
                style={!isRunning || isDarkMode ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
              <span 
                className={`flex-1 min-w-0 text-[11px] md:text-xs xl:text-[11px] 2xl:text-xs font-bold text-left leading-tight
                  ${!isRunning ? 'text-white' : (isDarkMode ? 'text-white' : 'text-[#FDC80D]')}
                `}
              >
                Зупинити парсер
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
