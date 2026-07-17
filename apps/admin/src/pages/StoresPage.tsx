import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import { MetricCard } from '@/components/MetricCard';

import PackageIcon from '@/assets/MetricCardIcons/Package.svg';
import SearchIcon from '@/assets/MetricCardIcons/Search.svg';
import RowsIcon from '@/assets/MetricCardIcons/Rows.svg';
import NeedsReviewIcon from '@/assets/MetricCardIcons/NeedsReview.svg';

// ── Helper Components ─────────────────────────────────────────────────────

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#003B2A]">
        Активна
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f3f4f6] text-[#4b5563] dark:bg-[#C30404] dark:text-[#400202]">
      Прихована
    </span>
  );
};

const StoreRowSkeleton: React.FC = () => (
  <div className="animate-pulse grid grid-cols-[1fr_120px_140px_180px_100px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 rounded-2xl mb-3 h-[74px]">
    <div className="min-w-0 pr-4 flex flex-col gap-1.5 pl-2">
      <div className="h-4 w-24 rounded bg-secondary" />
      <div className="h-3 w-32 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-8 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-5 w-16 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-24 rounded bg-secondary" />
    </div>
    <div className="flex items-center justify-center gap-2 pr-4">
      <div className="h-6 w-12 rounded bg-secondary" />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const StoresPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

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
  const limit = 10;
  const totalItems = filteredStores.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedStores = filteredStores.slice((page - 1) * limit, page * limit);

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
        <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full">
          <AlertCircle size={24} className="text-accentRed opacity-70" />
          <p className="text-sm text-textMuted font-medium text-center">
            Не вдалося завантажити магазини.<br />
            <span className="text-xs">Перевірте підключення до сервера.</span>
          </p>
        </div>
      );
    }

    if (paginatedStores.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
          Магазинів не знайдено.
        </div>
      );
    }

    return paginatedStores.map((store) => (
      <div 
        key={store.external_id} 
        className="grid grid-cols-[1fr_120px_140px_180px_100px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-border dark:hover:border-[#173B33]/30 transition-all mb-3"
      >
        {/* Column 1: Name & Chain */}
        <div className="min-w-0 pr-4 flex flex-col pl-2">
          <span className="text-sm font-semibold text-textMain">{store.name}</span>
          <span className="text-xs text-textMuted mt-0.5">{store.retail_chain}.ua</span>
        </div>

        {/* Column 2: Products count */}
        <div className="text-sm text-textMuted px-2 text-center">
          —
        </div>

        {/* Column 3: Status */}
        <div className="px-2 flex justify-center">
          <StatusBadge isActive={store.is_active} />
        </div>

        {/* Column 4: Last import date */}
        <div className="text-sm text-textMuted px-2 text-center whitespace-nowrap">
          {formatDate(store.synced_at)}
        </div>

        {/* Column 5: Actions */}
        <div className="flex items-center justify-center gap-1">
          <button className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary rounded-md transition-colors" title="Більше дій">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Всього магазинів" 
          value={stores.length.toLocaleString('uk-UA')} 
          icon={PackageIcon} 
          iconBgColor="#6FE3C2" 
        />
        <MetricCard 
          title="Активних магазинів" 
          value={totalActive.toLocaleString('uk-UA')} 
          icon={SearchIcon} 
          iconBgColor="#FD690D" 
        />
        <MetricCard 
          title="Неактивних магазинів" 
          value={totalInactive.toLocaleString('uk-UA')} 
          icon={RowsIcon} 
          iconBgColor="#FDC80D" 
        />
        <MetricCard 
          title="З помилками" 
          value={0} 
          icon={NeedsReviewIcon} 
          iconBgColor="#C30404" 
        />
      </div>

      {/* Toolbar: Filters & Actions */}
      <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-row md:items-center md:gap-3 animate-in fade-in p-[1px]">
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="col-span-1 w-full md:w-[340px]">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук магазинів..." 
              className="w-full pl-4 pr-10 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <Search size={14} className="text-textMuted" />
            </div>
          </div>
        </form>

        {/* Status filter */}
        <div className="col-span-1 w-full md:w-auto">
          <div className="relative">
            <select 
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-[180px] pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
            >
              <option value="">Всі статуси</option>
              <option value="active">Активна</option>
              <option value="hidden">Прихована</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="col-span-2 h-[40px] px-8 bg-white border border-[#4ADE80] text-[#173B33] dark:bg-transparent dark:text-[#4ADE80] dark:border-[#4ADE80]/30 rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap w-full md:w-auto"
        >
          Пошук
        </button>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[800px] w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_120px_140px_180px_100px] items-center text-left w-full px-4 py-3 bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl mb-4 text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] uppercase tracking-wider shadow-sm animate-in fade-in">
            <div className="pl-2">Магазин</div>
            <div className="px-2 text-center">Товарів</div>
            <div className="px-2 text-center">Статус</div>
            <div className="px-2 text-center">Останній імпорт</div>
            <div className="text-center pr-4">Дії</div>
          </div>

          {/* Rows container */}
          <div className="space-y-3 animate-in fade-in">
            {renderTableBody()}
          </div>
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
