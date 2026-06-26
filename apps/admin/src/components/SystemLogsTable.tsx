import React from 'react';
import { CheckSquare, AlertTriangle, UserPlus, RefreshCw, ChevronRight } from 'lucide-react';
import type { DashboardData } from '@/hooks/useDashboardData';

interface SystemLogsTableProps {
  logs: DashboardData['systemLogs'];
}

export const SystemLogsTable: React.FC<SystemLogsTableProps> = ({ logs }) => {
  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckSquare size={16} className="text-primary" />;
      case 'error':
        return <AlertTriangle size={16} className="text-accentRed" />;
      case 'warning':
        return <RefreshCw size={16} className="text-accentYellow" />;
      case 'info':
        return <UserPlus size={16} className="text-accentPurple" />;
      default:
        return <CheckSquare size={16} className="text-textMuted" />;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <h3 className="font-semibold text-lg text-textMain">Останні системні події</h3>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-textMuted text-sm border-b border-border">
              <th className="px-6 py-3 font-medium w-10"></th>
              <th className="px-2 py-3 font-medium w-24">Час</th>
              <th className="px-4 py-3 font-medium">Подія</th>
              <th className="px-4 py-3 font-medium">Деталі</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center">{getIcon(log.status)}</div>
                </td>
                <td className="px-2 py-3 text-sm text-textMain">{log.time}</td>
                <td className="px-4 py-3 text-sm font-medium text-textMain">{log.event}</td>
                <td className="px-4 py-3 text-sm text-textMuted">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 border-t border-border mt-auto">
        <a href="#" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всі події <ChevronRight size={16} className="ml-1" />
        </a>
      </div>
    </div>
  );
};

