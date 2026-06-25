import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { Calendar, CheckSquare, AlertTriangle } from 'lucide-react';

interface DataCollectionWidgetProps {
  data: DashboardData['dataCollection'];
}

export const DataCollectionWidget: React.FC<DataCollectionWidgetProps> = ({ data }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-lg text-textMain">Збір даних</h3>
      <p className="text-xs text-textMuted mb-4">Стан парсерів та оновлення цін</p>
      
      <div className="flex gap-2">
        <div className="flex-1 bg-background rounded-xl p-3 flex flex-col items-center justify-center border border-border">
          <Calendar size={16} className="text-accentGreen mb-2" />
          <div className="text-xl font-bold text-textMain leading-none mb-1">{data.updatedToday.toLocaleString('uk-UA')}</div>
          <div className="text-[10px] text-textMuted text-center leading-tight">Оновлено<br/>сьогодні</div>
        </div>
        
        <div className="flex-1 bg-background rounded-xl p-3 flex flex-col items-center justify-center border border-border">
          <CheckSquare size={16} className="text-primary mb-2" />
          <div className="text-xl font-bold text-textMain leading-none mb-1">{data.activeParsers} / 10</div>
          <div className="text-[10px] text-textMuted text-center leading-tight">Активні<br/>парсери</div>
        </div>
        
        <div className="flex-1 bg-background rounded-xl p-3 flex flex-col items-center justify-center border border-border">
          <AlertTriangle size={16} className="text-accentRed mb-2" />
          <div className="text-xl font-bold text-textMain leading-none mb-1">{data.errors}</div>
          <div className="text-[10px] text-textMuted text-center leading-tight"><br/>Помилки</div>
        </div>
      </div>
    </div>
  );
};

