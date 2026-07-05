import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PopularCategoriesWidgetProps {
  categories: DashboardData['popularCategories'];
}

export const PopularCategoriesWidget: React.FC<PopularCategoriesWidgetProps> = ({ categories }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm mt-6">
      <div className="p-5 pb-3">
        <h3 className="font-semibold text-lg text-textMain">Найпопулярніші категорії</h3>
      </div>
      
      <div className="flex-1 px-5 pb-2">
        <ul className="space-y-3">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border text-textMuted">
                   <span className="text-[10px]">📦</span>
                </div>
                <span className="text-textMain">{cat.name}</span>
              </div>
              <div className="bg-secondary px-2 py-0.5 rounded text-xs font-semibold text-primary">
                {cat.count.toLocaleString('uk-UA')}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-border mt-auto">
        <Link to="/categories" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всі категорії <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

