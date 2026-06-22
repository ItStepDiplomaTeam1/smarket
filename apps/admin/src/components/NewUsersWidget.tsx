import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { ChevronRight } from 'lucide-react';

interface NewUsersWidgetProps {
  users: DashboardData['newUsers'];
}

export const NewUsersWidget: React.FC<NewUsersWidgetProps> = ({ users }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm">
      <div className="p-5 pb-3">
        <h3 className="font-semibold text-lg text-textMain">Нові користувачі</h3>
      </div>
      
      <div className="flex-1 px-5 pb-2">
        <ul className="space-y-4">
          {users.map((user) => (
            <li key={user.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-xs font-bold text-textMuted border border-border">
                {user.initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-textMain leading-tight">{user.name}</span>
                <span className="text-xs text-textMuted leading-tight">{user.email}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-border mt-auto">
        <a href="#" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всіх користувачів <ChevronRight size={16} className="ml-1" />
        </a>
      </div>
    </div>
  );
};

