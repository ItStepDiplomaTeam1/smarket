import React from 'react';
import { Play, Square, RefreshCcw, Trash2 } from 'lucide-react';

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-textMain">Швидкі дії</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-accentGreen/30 text-accentGreen hover:bg-accentGreen/5 transition-colors">
          <Play size={20} fill="currentColor" />
          <span className="text-xs font-semibold text-center leading-tight">Запустити<br/>всі парсери</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-accentYellow/50 text-accentYellow hover:bg-accentYellow/5 transition-colors">
          <Square size={20} fill="currentColor" />
          <span className="text-xs font-semibold text-center leading-tight">Зупинити<br/>всі парсери</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-accentBlue/30 text-accentBlue hover:bg-accentBlue/5 transition-colors">
          <RefreshCcw size={20} />
          <span className="text-xs font-semibold text-center leading-tight">Оновити<br/>ціни</span>
        </button>

        <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-accentPurple/30 text-accentPurple hover:bg-accentPurple/5 transition-colors">
          <Trash2 size={20} />
          <span className="text-xs font-semibold text-center leading-tight">Очистити<br/>кеш</span>
        </button>
      </div>
    </div>
  );
};
