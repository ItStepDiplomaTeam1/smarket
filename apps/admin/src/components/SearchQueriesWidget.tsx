import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '@/hooks/useDashboardData';
import { ChevronRight } from 'lucide-react';

interface SearchQueriesWidgetProps {
  queries: DashboardData['searchQueries'];
}

export const SearchQueriesWidget: React.FC<SearchQueriesWidgetProps> = ({ queries }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm mt-6">
      <div className="p-5 pb-3">
        <h3 className="font-semibold text-lg text-textMain">Популярні пошукові запити</h3>
      </div>
      
      <div className="flex-1 px-5 pb-2">
        <ul className="space-y-3">
          {queries.map((q) => (
            <li key={q.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-textMuted w-4 text-center">{q.position}</span>
                <span className="text-textMain font-medium">{q.query}</span>
              </div>
              <div className="bg-secondary px-2 py-0.5 rounded text-xs font-semibold text-primary">
                {q.count.toLocaleString('uk-UA')}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-border mt-auto">
        <Link to="/products" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всі товари <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

