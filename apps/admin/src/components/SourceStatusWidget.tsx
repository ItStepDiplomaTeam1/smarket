import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { ChevronRight } from 'lucide-react';

interface SourceStatusWidgetProps {
  sources: DashboardData['sourceStatus'];
}

export const SourceStatusWidget: React.FC<SourceStatusWidgetProps> = ({ sources }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-lg text-textMain">Статус джерел</h3>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ul className="divide-y divide-border">
          {sources.map((source) => (
            <li key={source.id} className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative flex h-2.5 w-2.5">
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    source.state === 'working' ? 'bg-accentGreen' : 
                    source.state === 'sync' ? 'bg-accentYellow' : 'bg-accentRed'
                  }`}></span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-textMain leading-tight">{source.name}</p>
                  <p className={`text-xs font-medium ${
                    source.state === 'working' ? 'text-accentGreen' : 
                    source.state === 'sync' ? 'text-accentYellow' : 'text-accentRed'
                  }`}>{source.statusText}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-textMuted leading-tight">{source.timeText}</p>
                <p className="text-xs text-textMuted leading-tight">{source.detailsText}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-border mt-auto flex items-center justify-between">
        <div className="text-xs text-textMuted">
          Останнє оновлення<br/>03.06.2026 в 14:34
        </div>
        <button className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors flex items-center gap-1">
          Детальніше <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

