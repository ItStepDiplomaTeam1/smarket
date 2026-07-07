import React, { useState } from 'react';
import { 
  Search, 
  Edit, 
  MoreVertical,
  AlertCircle,
  ShoppingBag,
  Store as StoreIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useStores } from '@/hooks/useStores';

// ── Helper Components ─────────────────────────────────────────────────────

const MetricCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trendText: string;
  trendPositive?: boolean;
}> = ({ title, value, icon: Icon, iconBg, iconColor, trendText, trendPositive = false }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-lg ${iconBg}`}>
        <Icon className={iconColor} size={20} />
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-textMuted mb-1">{title}</h3>
      <div className="text-2xl font-bold text-textMain">{value}</div>
      <p className={`text-xs mt-1.5 flex items-center font-medium ${trendPositive ? 'text-green-500' : 'text-red-500'}`}>
        <span className="mr-1">{trendPositive ? '↑' : '↓'}</span> {trendText}
      </p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e]">
        Активна
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f3f4f6] text-[#4b5563]">
      Прихована
    </span>
  );
};

const StoreRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="py-4 pl-6 pr-3 w-12">
      <div className="w-4 h-4 bg-secondary rounded" />
    </td>
    <td className="py-4 px-3">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-3 w-32 rounded bg-secondary" />
        </div>
      </div>
    </td>
    <td className="py-4 px-3"><div className="h-4 w-8 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-5 w-16 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-24 rounded bg-secondary" /></td>
    <td className="py-4 pl-3 pr-6 text-right"><div className="h-6 w-12 rounded bg-secondary inline-block" /></td>
  </tr>
);

// ── Main Component ────────────────────────────────────────────────────────

const StoresPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: stores = [], isLoading, isError } = useStores();

  // Локальна фільтрація
  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(activeSearch.toLowerCase());
    
    const matchesStatus = 
      selectedStatus === '' ? true :
      selectedStatus === 'active' ? store.is_active :
      selectedStatus === 'hidden' ? !store.is_active : true;

    return matchesSearch && matchesStatus;
  });

  // Локальна пагінація
  const limit = 12;
  const totalItems = filteredStores.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedStores = filteredStores.slice((page - 1) * limit, page * limit);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedStores.length && paginatedStores.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedStores.map(s => s.external_id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
  };

  // Форматування дати на чистому JS
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Сьогодні, 10:30';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Сьогодні, 10:30';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    } catch {
      return 'Сьогодні, 10:30';
    }
  };

  const renderTableBody = () => {
    if (isLoading) return Array.from({ length: 5 }).map((_, i) => <StoreRowSkeleton key={i} />);

    if (isError) {
      return (
        <tr>
          <td colSpan={6} className="py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-accentRed opacity-70" />
              <p className="text-sm text-textMuted font-medium">
                Не вдалося завантажити магазини.<br />
                <span className="text-xs">Перевірте підключення до сервера.</span>
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (paginatedStores.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-8 text-center text-sm text-textMuted font-medium">
            Магазинів не знайдено.
          </td>
        </tr>
      );
    }

    return paginatedStores.map((store) => (
      <tr key={store.external_id} className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0">
        <td className="py-4 pl-6 pr-3">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
            checked={selectedIds.has(store.external_id)} 
            onChange={() => toggleSelect(store.external_id)} 
          />
        </td>
        <td className="py-4 px-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 text-textMuted">
              {/* Іконка-заглушка для магазину */}
              <StoreIcon size={20} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-textMain">{store.name}</span>
              <span className="text-xs text-textMuted mt-0.5">{store.retail_chain}.ua</span>
            </div>
          </div>
        </td>
        <td className="py-4 px-3 text-sm text-textMuted whitespace-nowrap">
          {/* Mocked product count to match design */}
          —
        </td>
        <td className="py-4 px-3">
          <StatusBadge isActive={store.is_active} />
        </td>
        <td className="py-4 px-3 text-sm text-textMuted whitespace-nowrap">
          {formatDate(store.synced_at)}
        </td>
        <td className="py-4 px-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button className="p-1.5 text-textMuted hover:text-primary hover:bg-secondary rounded-md transition-colors" title="Редагувати">
              <Edit size={16} />
            </button>
            <button className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary rounded-md transition-colors" title="Більше дій">
              <MoreVertical size={16} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const totalActive = stores.filter(s => s.is_active).length;
  const totalInactive = stores.length - totalActive;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Магазини</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Магазини</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Всього магазинів" value={stores.length} icon={ShoppingBag} iconBg="bg-[#e6f4ea]" iconColor="text-[#1e8e3e]" trendText="+2 від учора" trendPositive={true} />
        <MetricCard title="Активних магазинів" value={totalActive} icon={CheckCircle2} iconBg="bg-[#fff7e6]" iconColor="text-[#fa8c16]" trendText="+1 від учора" trendPositive={true} />
        <MetricCard title="Неактивних магазинів" value={totalInactive} icon={XCircle} iconBg="bg-[#fef7e0]" iconColor="text-[#b08b00]" trendText="-1 від учора" trendPositive={false} />
        <MetricCard title="З помилками" value={0} icon={AlertTriangle} iconBg="bg-[#e8f0fe]" iconColor="text-[#1a73e8]" trendText="-2 від учора" trendPositive={false} />
      </div>

      {/* Toolbar: Filters & Actions */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input
              type="text"
              placeholder="Пошук магазинів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-textMuted"
            />
          </form>

          {/* Status filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium hidden sm:inline-block">Статус</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] min-w-[140px] w-full sm:w-auto"
            >
              <option value="">Всі статуси</option>
              <option value="active">Активна</option>
              <option value="hidden">Прихована</option>
            </select>
          </div>
          
          <button 
            type="button"
            onClick={handleSearchSubmit}
            className="h-[38px] px-4 bg-surface border border-border rounded-lg text-sm font-medium text-textMain hover:bg-secondary transition-colors w-full sm:w-auto"
          >
            Пошук
          </button>
        </div>

        <button className="h-[38px] flex items-center justify-center gap-2 px-5 py-2 bg-[#1a4731] hover:bg-[#133524] text-white rounded-lg text-sm font-medium transition-colors shrink-0 w-full lg:w-auto">
          <span>Додати магазин</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 pl-6 pr-3 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
                    checked={paginatedStores.length > 0 && selectedIds.size === paginatedStores.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Магазин
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Товарів
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Статус
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Останній імпорт
                </th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-textMuted uppercase tracking-wider w-24">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-textMuted">
            {page}-{Math.min(page * limit, totalItems)} з {totalItems} магазинів
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Попередня</span>
              &lt;
            </button>
            <div className="flex items-center">
              <span className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md bg-primary/10 text-primary">
                {page}
              </span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Наступна</span>
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresPage;
