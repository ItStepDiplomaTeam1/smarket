import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

import SuccessIcon from '@/assets/LogIcons/Success.svg';
import ErrorIcon from '@/assets/LogIcons/Error.svg';
import WarningIcon from '@/assets/LogIcons/Warning.svg';
import NewUserIcon from '@/assets/LogIcons/NewUser.svg';
import StartIcon from '@/assets/LogIcons/Start.svg';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);

    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    if (diffDays === 0) return `Сьогодні, ${timeStr}`;
    if (diffDays === 1) return `Вчора, ${timeStr}`;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}, ${timeStr}`;
  } catch {
    return dateString;
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'info':
      return <img src={NewUserIcon} alt="info" className="w-4 h-4 object-contain" />;
    case 'warning':
      return <img src={WarningIcon} alt="warning" className="w-4 h-4 object-contain" />;
    case 'error':
      return <img src={ErrorIcon} alt="error" className="w-4 h-4 object-contain" />;
    case 'success':
      return <img src={SuccessIcon} alt="success" className="w-4 h-4 object-contain" />;
    default:
      return <img src={StartIcon} alt="log" className="w-4 h-4 object-contain" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'info':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-accentPurple">Info</span>;
    case 'warning':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-50 text-accentYellow">Warning</span>;
    case 'error':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-accentRed">Error</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-50 text-gray-500">{severity}</span>;
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Row Skeleton ──────────────────────────────────────────────────────────────

const LogRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50 last:border-0">
    <td className="py-4 pl-6 pr-3"><div className="flex justify-center"><div className="h-4 w-4 rounded bg-secondary" /></div></td>
    <td className="py-4 px-3"><div className="h-4 w-24 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-20 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-32 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-24 rounded bg-secondary" /></td>
    <td className="py-4 pl-3 pr-6"><div className="h-4 w-48 rounded bg-secondary" /></td>
  </tr>
);

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onChange: (p: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalItems, limit, onChange }) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <p className="text-sm text-textMuted">
        {totalItems > 0 ? `${start}–${end} з ${totalItems} подій` : '0 подій'}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-textMuted hover:text-textMain"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onChange(p)}
            disabled={p === '…'}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
              p === page
                ? 'bg-[#EBF6F1] text-primary border border-primary/20'
                : p === '…'
                ? 'text-textMuted cursor-default'
                : 'text-textMain hover:bg-secondary'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-textMuted hover:text-textMain"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const LogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severity, setSeverity] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when severity changes
  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSeverity(e.target.value);
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<AuditLogResponse>({
    queryKey: ['audit-logs', page, limit, debouncedSearch, severity],
    queryFn: async () => {
      const response = await apiClient.get<AuditLogResponse>('/admin/audit', {
        params: {
          page,
          limit,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(severity && { severity })
        }
      });
      return response.data;
    }
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Журнал дій</h1>
          <p className="text-textMuted text-sm mt-1">
            Перегляд та аналіз системних подій платформи.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Пошук подій..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="relative shrink-0 w-full md:w-48">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
          <select
            value={severity}
            onChange={handleSeverityChange}
            className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-textMain appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
          >
            <option value="">Усі події</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary/50 text-textMuted text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-3 font-semibold w-12 text-center"></th>
                <th className="px-3 py-3 font-semibold w-32">Час</th>
                <th className="px-3 py-3 font-semibold w-24">Рівень</th>
                <th className="px-3 py-3 font-semibold w-48">Подія</th>
                <th className="px-3 py-3 font-semibold w-48">Виконавець</th>
                <th className="px-6 py-3 font-semibold">Повідомлення</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <>
                  <LogRowSkeleton />
                  <LogRowSkeleton />
                  <LogRowSkeleton />
                  <LogRowSkeleton />
                  <LogRowSkeleton />
                  <LogRowSkeleton />
                </>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-textMuted">
                    <AlertTriangle size={24} className="mx-auto mb-2 text-accentRed" />
                    Помилка завантаження даних.
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-textMuted">
                    Подій не знайдено.
                  </td>
                </tr>
              ) : (
                data?.items.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex justify-center">{getSeverityIcon(log.severity)}</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-textMuted whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-textMain">
                      {log.event_type}
                    </td>
                    <td className="px-3 py-4 text-sm text-textMuted truncate max-w-[12rem]" title={log.actor || '-'}>
                      {log.actor || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-textMain">
                      <div className="line-clamp-2" title={log.message || (log.details ? JSON.stringify(log.details) : '')}>
                        {log.message || (log.details ? JSON.stringify(log.details) : '-')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Container */}
      {!isLoading && !isError && (
        <div className="pb-6">
          <Pagination
            page={page}
            limit={limit}
            totalItems={data?.total ?? 0}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default LogsPage;
