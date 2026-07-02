import React, { useState } from 'react';
import { 
  Search, 
  Edit, 
  MoreVertical,
  AlertCircle,
  Package
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

// ── Helper Components ─────────────────────────────────────────────────────

const StatusBadge: React.FC<{ isHidden?: boolean }> = ({ isHidden }) => {
  if (isHidden === true) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f3f4f6] text-[#4b5563]">
        Прихована
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e]">
      Активна
    </span>
  );
};

const CategoryRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="py-4 pl-6 pr-3 w-12">
      <div className="w-4 h-4 bg-secondary rounded" />
    </td>
    <td className="py-4 px-3">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
        <div className="h-4 w-32 rounded bg-secondary" />
      </div>
    </td>
    <td className="py-4 px-3"><div className="h-5 w-16 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-24 rounded bg-secondary" /></td>
    <td className="py-4 pl-3 pr-6 text-right"><div className="h-6 w-12 rounded bg-secondary inline-block" /></td>
  </tr>
);

// ── Main Component ────────────────────────────────────────────────────────

const CategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: categories = [], isLoading, isError } = useCategories();

  // Локальна фільтрація, оскільки бекенд зараз повертає весь список
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(activeSearch.toLowerCase());
    
    // Якщо бекенд не повертає is_hidden, за замовчуванням вважаємо false
    const isHidden = category.is_hidden ?? false;
    const matchesStatus = 
      selectedStatus === '' ? true :
      selectedStatus === 'active' ? !isHidden :
      selectedStatus === 'hidden' ? isHidden : true;

    return matchesSearch && matchesStatus;
  });

  // Локальна пагінація
  const limit = 12;
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedCategories = filteredCategories.slice((page - 1) * limit, page * limit);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCategories.length && paginatedCategories.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCategories.map(c => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
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
    if (isLoading) return Array.from({ length: 5 }).map((_, i) => <CategoryRowSkeleton key={i} />);

    if (isError) {
      return (
        <tr>
          <td colSpan={5} className="py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-accentRed opacity-70" />
              <p className="text-sm text-textMuted font-medium">
                Не вдалося завантажити категорії.<br />
                <span className="text-xs">Перевірте підключення до сервера.</span>
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (paginatedCategories.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="py-8 text-center text-sm text-textMuted font-medium">
            Категорій не знайдено.
          </td>
        </tr>
      );
    }

    return paginatedCategories.map((category) => (
      <tr key={category.id} className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0">
        <td className="py-4 pl-6 pr-3">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
            checked={selectedIds.has(category.id)} 
            onChange={() => toggleSelect(category.id)} 
          />
        </td>
        <td className="py-4 px-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 text-textMuted">
              {/* Іконка-заглушка для категорії */}
              <Package size={20} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold text-textMain">{category.name}</span>
          </div>
        </td>
        <td className="py-4 px-3">
          <StatusBadge isHidden={category.is_hidden} />
        </td>
        <td className="py-4 px-3 text-sm text-textMuted whitespace-nowrap">
          {formatDate(category.updated_at || category.created_at)}
        </td>
        <td className="py-4 pl-3 pr-6 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Категорії</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Категорії</p>
      </div>

      {/* Toolbar: Filters & Actions */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input
              type="text"
              placeholder="Пошук категорій..."
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
                    checked={paginatedCategories.length > 0 && selectedIds.size === paginatedCategories.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Назва категорії
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Статус
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Оновлення
                </th>
                <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold text-textMuted uppercase tracking-wider">
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
            {page}-{Math.min(page * limit, totalItems)} з {totalItems} категорій
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

export default CategoriesPage;
