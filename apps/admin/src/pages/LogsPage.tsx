import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { MetricCard } from '@/components/MetricCard';

import SuccessIcon from '@/assets/LogIcons/Success.svg';
import ErrorIcon from '@/assets/LogIcons/Error.svg';
import WarningIcon from '@/assets/LogIcons/Warning.svg';
import NewUserIcon from '@/assets/LogIcons/NewUser.svg';
import StartIcon from '@/assets/LogIcons/Start.svg';

import MailIcon from '@/assets/MetricCardIcons/Mail.svg';
import CalendarIcon from '@/assets/MetricCardIcons/Calendar.svg';
import MetricErrorIcon from '@/assets/MetricCardIcons/Error.svg';

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

    if (diffDays === 0) return timeStr;
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
  const normSeverity = severity.toLowerCase();
  switch (normSeverity) {
    case 'info':
    case 'success':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-50 text-[#057A55] dark:bg-[#057A55] dark:text-green-50 transition-colors">
          Успішно
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-yellow-50 text-accentYellow dark:bg-accentYellow dark:text-yellow-50 transition-colors">
          Попередження
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-accentRed dark:bg-accentRed dark:text-red-50 transition-colors">
          Помилка
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-50 text-gray-500 dark:bg-gray-500 dark:text-gray-50 transition-colors">
          {severity}
        </span>
      );
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
  <div className="animate-pulse grid grid-cols-[50px_130px_90px_160px_160px_1fr] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 rounded-2xl mb-3 h-[68px]">
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 bg-secondary rounded animate-pulse" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-20 rounded bg-secondary animate-pulse" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-32 rounded bg-secondary animate-pulse" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
    </div>
    <div className="min-w-0 pl-2">
      <div className="h-4 w-48 rounded bg-secondary animate-pulse" />
    </div>
  </div>
);

const LogRowSkeletonMobile: React.FC = () => (
  <div className="animate-pulse grid grid-cols-[1.2fr_1.2fr_0.8fr] gap-2 items-center w-full px-4 py-4 bg-surface border border-border/70 rounded-2xl h-[58px]">
    <div className="h-4 w-20 rounded bg-secondary" />
    <div className="h-4 w-24 rounded bg-secondary" />
    <div className="flex justify-end">
      <div className="h-5 w-16 rounded bg-secondary" />
    </div>
  </div>
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
    <div className="flex items-center justify-between gap-4 mt-6">
      <p className="text-xs sm:text-sm text-textMuted font-medium">
        {totalItems > 0 ? `Показано ${start}-${end} з ${totalItems}` : 'Показано 0 з 0'}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#1D2B24] border border-border dark:border-[#4ADE80]/15 rounded-xl shadow-sm text-textMuted hover:text-textMain hover:bg-secondary dark:hover:bg-[#4ADE80]/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#1D2B24] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onChange(p)}
            disabled={p === '…'}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors shadow-sm ${
              p === page
                ? 'bg-[#6FE3C2] text-[#173B33] border-none'
                : p === '…'
                ? 'text-textMuted cursor-default shadow-none bg-transparent'
                : 'bg-white dark:bg-[#1D2B24] border border-border dark:border-[#4ADE80]/15 text-textMain hover:bg-secondary dark:hover:bg-[#4ADE80]/5'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#1D2B24] border border-border dark:border-[#4ADE80]/15 rounded-xl shadow-sm text-textMuted hover:text-textMain hover:bg-secondary dark:hover:bg-[#4ADE80]/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#1D2B24] transition-colors"
        >
          <ChevronRight size={16} />
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

  const handleSearchSubmit = () => {
    setDebouncedSearch(search);
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

  const todayDateStr = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  })();

  const stats = {
    total: data?.total ?? 2248,
    today: 5,
    errors: 12
  };

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 animate-in fade-in">
        <MetricCard
          className="col-span-2 lg:col-span-1 flex-row lg:flex-col lg:items-start"
          title="Усього дій"
          value={stats.total.toLocaleString('uk-UA')}
          icon={MailIcon}
          iconBgColor="#6FE3C2"
          subtext="За весь час"
        />
        <MetricCard
          className="col-span-1"
          title="Сьогодні"
          value={stats.today}
          icon={CalendarIcon}
          iconBgColor="#1A65F2"
          subtext={todayDateStr}
        />
        <MetricCard
          className="col-span-1"
          title="Помилки"
          value={stats.errors}
          icon={MetricErrorIcon}
          iconBgColor="#C30404"
          subtext="Потребують уваги"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:flex-row sm:items-end sm:gap-3.5 animate-in fade-in">
        <div className="relative col-span-1 w-full sm:w-[340px]">
          <input
            type="text"
            placeholder="Пошук за дією..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60 dark:placeholder:text-[#94A3B8]"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Search size={14} className="text-textMuted" />
          </div>
        </div>

        <div className="relative col-span-1 w-full sm:w-[180px] shrink-0">
          <select
            value={severity}
            onChange={handleSeverityChange}
            className="w-full pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
          >
            <option value="">Всі статуси</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <button
          onClick={handleSearchSubmit}
          className="col-span-2 shrink-0 w-full sm:w-auto h-[40px] px-10 bg-white dark:bg-transparent border border-[#4ADE80] text-[#173B33] dark:text-[#4ADE80] rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap"
        >
          Пошук
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block w-full overflow-x-auto pb-2 animate-in fade-in">
        <div className="min-w-[950px] w-full flex flex-col">
          {/* Header Row */}
          <div className="grid grid-cols-[50px_130px_90px_160px_160px_1fr] items-center text-left w-full px-4 py-3 bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl mb-4 text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] uppercase tracking-wider shadow-sm">
            <div /> {/* Spacer for icon */}
            <div className="px-2 text-center">Час</div>
            <div className="px-2 text-center">Рівень</div>
            <div className="px-2 text-center">Подія</div>
            <div className="px-2 text-center">Виконавець</div>
            <div className="pl-2">Повідомлення</div>
          </div>

          {/* Rows container */}
          <div>
            {isLoading ? (
              <div className="space-y-3">
                <LogRowSkeleton />
                <LogRowSkeleton />
                <LogRowSkeleton />
                <LogRowSkeleton />
                <LogRowSkeleton />
                <LogRowSkeleton />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full text-textMuted">
                <AlertTriangle size={24} className="text-accentRed" />
                Помилка завантаження даних.
              </div>
            ) : data?.items?.length === 0 ? (
              <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
                Подій не знайдено.
              </div>
            ) : (
              <div className="space-y-3">
                {data?.items.map((log) => (
                  <div 
                    key={log.id} 
                    className="grid grid-cols-[50px_130px_90px_160px_160px_1fr] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-border dark:hover:border-[#173B33]/30 transition-all"
                  >
                    {/* Column 1: Icon */}
                    <div className="flex items-center justify-center">
                      {getSeverityIcon(log.severity)}
                    </div>

                    {/* Column 2: Date/Time */}
                    <div className="px-2 text-center text-sm text-textMuted whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </div>

                    {/* Column 3: Severity Badge */}
                    <div className="px-2 flex justify-center">
                      {getSeverityBadge(log.severity)}
                    </div>

                    {/* Column 4: Event Type */}
                    <div className="px-2 text-center text-sm font-semibold text-textMain">
                      {log.event_type}
                    </div>

                    {/* Column 5: Actor */}
                    <div className="px-2 text-center text-sm text-textMuted truncate" title={log.actor || '-'}>
                      {log.actor || '-'}
                    </div>

                    {/* Column 6: Message */}
                    <div className="text-sm text-textMain pl-2 min-w-0">
                      <div className="line-clamp-2" title={log.message || (log.details ? JSON.stringify(log.details) : '')}>
                        {log.message || (log.details ? JSON.stringify(log.details) : '-')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card-style Table/List */}
      <div className="block md:hidden space-y-3 animate-in fade-in">
        {/* Header row */}
        <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr] gap-2 items-center w-full px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-wider">
          <div>Користувач</div>
          <div className="text-center">Дія</div>
          <div className="text-center">Статус</div>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="space-y-3">
            <LogRowSkeletonMobile />
            <LogRowSkeletonMobile />
            <LogRowSkeletonMobile />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full text-textMuted">
            <AlertTriangle size={24} className="text-accentRed" />
            Помилка завантаження даних.
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
            Подій не знайдено.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data?.items.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1.2fr_1.2fr_0.8fr] gap-2 items-center w-full px-4 py-3.5 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                {/* User */}
                <div className="text-xs font-semibold text-textMain truncate pr-2">
                  {log.actor || 'Система'}
                </div>

                {/* Action */}
                <div className="text-xs text-textMuted line-clamp-2 pr-2 text-center" title={log.event_type}>
                  {log.event_type}
                </div>

                {/* Status/Badge */}
                <div className="flex justify-center">
                  {getSeverityBadge(log.severity)}
                </div>
              </div>
            ))}
          </div>
        )}
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
