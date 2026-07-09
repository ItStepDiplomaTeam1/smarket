import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, AlertTriangle, UserPlus, RefreshCw, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface AuditLog {
  id: number;
  actor: string | null;
  event_type: string;
  severity: string;
  message: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

interface AuditLogResponse {
  total: number;
  page: number;
  limit: number;
  items: AuditLog[];
}

export const SystemLogsTable: React.FC = () => {
  const { data, isLoading, isError } = useQuery<AuditLogResponse>({
    queryKey: ['dashboard-audit-logs'],
    queryFn: async () => {
      const response = await apiClient.get<AuditLogResponse>('/admin/audit', {
        params: { page: 1, limit: 5 }
      });
      return response.data;
    }
  });

  const getIcon = (severity: string) => {
    switch (severity) {
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

  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return dateString;
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
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-textMuted text-sm">
                  Завантаження...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-textMuted text-sm">
                  Помилка завантаження даних
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-textMuted text-sm">
                  Подій не знайдено
                </td>
              </tr>
            ) : (
              data?.items?.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">{getIcon(log.severity)}</div>
                  </td>
                  <td className="px-2 py-3 text-sm text-textMain">{formatTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-textMain">{log.event_type}</td>
                  <td className="px-4 py-3 text-sm text-textMuted truncate max-w-[200px]" title={log.message || ''}>
                    {log.message || (log.details ? JSON.stringify(log.details) : '-')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 border-t border-border mt-auto">
        <Link to="/logs" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всі події <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

