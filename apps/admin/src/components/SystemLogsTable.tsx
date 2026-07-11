import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

import SuccessIcon from '@/assets/Logs/Success.svg';
import ErrorIcon from '@/assets/Logs/Error.svg';
import WarningIcon from '@/assets/Logs/Warning.svg';
import NewUserIcon from '@/assets/Logs/NewUser.svg';
import StartIcon from '@/assets/Logs/Start.svg';

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
        return <img src={SuccessIcon} alt="success" className="w-4 h-4 object-contain" />;
      case 'error':
        return <img src={ErrorIcon} alt="error" className="w-4 h-4 object-contain" />;
      case 'warning':
        return <img src={WarningIcon} alt="warning" className="w-4 h-4 object-contain" />;
      case 'info':
        return <img src={NewUserIcon} alt="info" className="w-4 h-4 object-contain" />;
      default:
        return <img src={StartIcon} alt="log" className="w-4 h-4 object-contain" />;
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
    <div className="bg-surface border border-border rounded-2xl flex flex-col h-[404px] overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-border shrink-0">
        <h3 className="font-semibold text-lg text-textMain">Останні системні події</h3>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[600px] text-left border-collapse table-fixed">
          <thead>
            <tr className="text-textMuted text-sm border-b border-border shrink-0">
              <th className="px-6 py-3 font-medium w-16"></th>
              <th className="px-2 py-3 font-medium w-24">Час</th>
              <th className="px-4 py-3 font-medium w-48">Подія</th>
              <th className="px-4 py-3 font-medium">Деталі</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse h-[49px]">
                  <td colSpan={4} className="px-6 py-3">
                    <div className="h-4 bg-border/40 rounded w-2/3 mx-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr className="h-[245px]">
                <td colSpan={4} className="text-center text-textMuted text-sm py-8">
                  Помилка завантаження даних
                </td>
              </tr>
            ) : (() => {
              const logs = data?.items || [];
              const paddedLogs = [...logs];
              while (paddedLogs.length < 5) {
                paddedLogs.push({
                  id: -1 - paddedLogs.length,
                  actor: null,
                  event_type: '',
                  severity: 'empty',
                  message: '',
                  details: null,
                  created_at: ''
                });
              }
              return paddedLogs.map((log) => {
                if (log.id < 0) {
                  return (
                    <tr key={log.id} className="h-[49px]">
                      <td colSpan={4} className="px-6 py-3 text-center text-textMuted text-xs select-none">
                        &nbsp;
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors h-[49px]">
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center">{getIcon(log.severity)}</div>
                    </td>
                    <td className="px-2 py-3 text-sm text-textMain">{formatTime(log.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-textMain truncate" title={log.event_type}>{log.event_type}</td>
                    <td className="px-4 py-3 text-sm text-textMuted truncate" title={log.message || ''}>
                      {log.message || (log.details ? JSON.stringify(log.details) : '-')}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 border-t border-border mt-auto shrink-0">
        <Link to="/logs" className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center">
          Переглянути всі події <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

