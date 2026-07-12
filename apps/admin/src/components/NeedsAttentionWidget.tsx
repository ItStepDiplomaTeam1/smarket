import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import ErrorIcon from '@/assets/LogIcons/Error.svg';
import WarningIcon from '@/assets/LogIcons/Warning.svg';
import SuccessIcon from '@/assets/LogIcons/Success.svg';
import StartIcon from '@/assets/LogIcons/Start.svg';

export interface NeedsAttentionItem {
  id: string;
  source: string;
  message?: string;
  time?: string;
  type: 'error' | 'warning' | 'sync' | 'success';
}

interface NeedsAttentionWidgetProps {
  items: DashboardData['needsAttention'];
}

export const NeedsAttentionWidget: React.FC<NeedsAttentionWidgetProps> = ({ items }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm h-full">
      <div className="p-5 pb-3">
        <h3 className="font-semibold text-lg text-textMain">Потребує уваги</h3>
      </div>
      
      <div className="flex-1 px-5 pb-2">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 shrink-0">
                {item.type === 'error' && <img src={ErrorIcon} alt="error" className="w-4 h-4 object-contain" />}
                {item.type === 'sync' && <img src={StartIcon} alt="sync" className="w-4 h-4 object-contain animate-spin" />}
                {item.type === 'warning' && <img src={WarningIcon} alt="warning" className="w-4 h-4 object-contain" />}
                {item.type === 'success' && <img src={SuccessIcon} alt="success" className="w-4 h-4 object-contain" />}
              </div>
              <div>
                <p className="text-textMain font-medium leading-tight">
                  {item.source} {item.message && <span className="font-normal text-textMuted">— {item.message}</span>}
                </p>
                {item.time && (
                  <p className="text-xs text-textMuted mt-0.5">
                    {item.type === 'error' && <span className="text-accentRed mr-1">Остання помилка:</span>}
                    <span className={item.type === 'error' ? 'text-accentRed font-medium' : 'text-textMain'}>
                      {item.time}
                    </span>
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

