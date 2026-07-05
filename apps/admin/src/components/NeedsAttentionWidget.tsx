import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { AlertTriangle, RefreshCw, Info, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NeedsAttentionWidgetProps {
  items: DashboardData['needsAttention'];
}

export const NeedsAttentionWidget: React.FC<NeedsAttentionWidgetProps> = ({ items }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm">
      <div className="p-5 pb-3">
        <h3 className="font-semibold text-lg text-textMain">Потребує уваги</h3>
      </div>
      
      <div className="flex-1 px-5 pb-2">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <div className="mt-0.5">
                {item.type === 'error' && <AlertTriangle size={16} className="text-accentRed" />}
                {item.type === 'sync' && <RefreshCw size={16} className="text-accentYellow" />}
                {item.type === 'warning' && <Info size={16} className="text-accentYellow" />}
              </div>
              <div>
                <p className="text-textMain font-medium leading-tight">
                  {item.source} {item.message && <span className="font-normal text-textMuted">— {item.message}</span>}
                </p>
                {item.time && (
                  <p className="text-xs text-textMuted mt-0.5">
                    {item.type === 'error' ? 'Остання помилка:' : 'Запущено:'} <span className={item.type === 'error' ? 'text-accentRed font-medium' : 'text-textMain'}>{item.time}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-border mt-auto">
        <Link to="/products" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Перейти до товарів <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

