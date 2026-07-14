import React, { useState } from 'react';
import {
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCategories, useToggleCategoryVisibility } from '@/hooks/useCategories';

// ── Constants ─────────────────────────────────────────────────────────────────

const GLOBAL_CATEGORIES: Record<number, string> = {
  1: 'Продукти харчування',
  2: 'Напої',
  3: 'Солодощі та снеки',
  4: 'Алкоголь та тютюн',
  5: 'Товари для дому та побуту',
  6: 'Краса та догляд',
  7: 'Зоотовари',
  8: 'Дитячі товари',
  9: 'Хобі та відпочинок',
  10: 'Акції та промо',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Сьогодні, 10:30';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Сьогодні, 10:30';
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
    return 'Сьогодні, 10:30';
  }
};

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ isHidden?: boolean }> = ({ isHidden }) => {
  if (isHidden) {
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

// ── Row Skeleton ──────────────────────────────────────────────────────────────

const CategoryRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50 last:border-0">
    <td className="py-4 pl-6 pr-3">
      <div className="h-4 w-32 rounded bg-secondary" />
    </td>
    <td className="py-4 px-3"><div className="h-5 w-16 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-28 rounded bg-secondary" /></td>
    <td className="py-4 px-3"><div className="h-4 w-28 rounded bg-secondary" /></td>
    <td className="py-4 pl-3 pr-6 text-right"><div className="h-5 w-12 rounded bg-secondary inline-block" /></td>
    <td className="py-4 px-3"><div className="h-4 w-28 rounded bg-secondary" /></td>
    <td className="py-4 pl-3 pr-6 text-right"><div className="h-5 w-12 rounded bg-secondary inline-block" /></td>
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
        {start}–{end} з {totalItems} категорій
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ell-${i}`} className="w-8 text-center text-sm text-textMuted">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                p === page ? 'bg-primary text-white' : 'text-textMain hover:bg-secondary'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const LIMIT = 12;

const CategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGlobalCategory, setSelectedGlobalCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories = [], isLoading, isError } = useCategories();
  const { mutate: toggleVisibility, isPending: isToggling } = useToggleCategoryVisibility();

  // Локальна фільтрація
  const filtered = categories.filter((c) => {
    const matchesSearch = !activeSearch || c.name.toLowerCase().includes(activeSearch.toLowerCase());
    const isHidden = c.is_hidden ?? false;
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === 'active' && !isHidden) ||
      (selectedStatus === 'hidden' && isHidden);
    const matchesGlobalCategory =
      !selectedGlobalCategory ||
      c.main_category_id === Number(selectedGlobalCategory);
    return matchesSearch && matchesStatus && matchesGlobalCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
  };

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => <CategoryRowSkeleton key={i} />);
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={4} className="py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-[#c5221f] opacity-70" />
              <p className="text-sm text-textMuted font-medium">
                Не вдалося завантажити категорії.<br />
                <span className="text-xs">Перевірте підключення до сервера.</span>
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (paginated.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="py-12 text-center text-sm text-textMuted font-medium">
            Категорій не знайдено.
          </td>
        </tr>
      );
    }

    return paginated.map((category) => (
      <tr
        key={category.id}
        className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0"
      >
        {/* Назва категорії */}
        <td className="py-4 pl-6 pr-3">
          <span className="text-sm font-semibold text-textMain">{category.name}</span>
        </td>
        {/* Статус */}
        <td className="py-4 px-3">
          <StatusBadge isHidden={category.is_hidden} />
        </td>
        {/* Глобальна категорія */}
        <td className="py-4 px-3">
          <span className="text-sm text-textMuted">
            {category.main_category_id ? GLOBAL_CATEGORIES[category.main_category_id] || 'Інше' : 'Інше'}
          </span>
        </td>
        {/* Оновлення */}
        <td className="py-4 px-3 text-sm text-textMuted whitespace-nowrap">
          {formatDate(category.updated_at || category.created_at)}
        </td>
        {/* Дії */}
        <td className="py-4 px-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => toggleVisibility({ categoryId: category.id, isHidden: !category.is_hidden })}
              disabled={isToggling}
              className={`p-1.5 rounded-md transition-colors ${
                category.is_hidden
                  ? 'text-textMuted hover:text-textMain hover:bg-secondary'
                  : 'text-textMuted hover:text-[#c5221f] hover:bg-[#c5221f]/10'
              } disabled:opacity-50`}
              title={category.is_hidden ? 'Показати' : 'Приховати'}
            >
              {category.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Категорії</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Категорії</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium">Пошук категорій</span>
            <form onSubmit={handleSearch} className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
              <input
                type="text"
                placeholder="Пошук категорії..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] pl-8 pr-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-textMuted"
              />
            </form>
          </div>

          {/* Status filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium">Статус</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="h-[38px] px-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] min-w-[140px] w-full sm:w-auto"
            >
              <option value="">Зі статусу</option>
              <option value="active">Активна</option>
              <option value="hidden">Прихована</option>
            </select>
          </div>

          {/* Global Category filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium">Глобальна категорія</span>
            <select
              value={selectedGlobalCategory}
              onChange={(e) => { setSelectedGlobalCategory(e.target.value); setPage(1); }}
              className="h-[38px] px-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] min-w-[180px] w-full sm:w-auto"
            >
              <option value="">Всі глобальні категорії</option>
              {Object.entries(GLOBAL_CATEGORIES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>


          <button
            type="button"
            onClick={handleSearch}
            className="h-[38px] px-5 bg-surface border border-border rounded-lg text-sm font-medium text-textMain hover:bg-secondary transition-colors whitespace-nowrap w-full sm:w-auto"
          >
            Пошук
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 pl-6 pr-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Назва категорії
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Статус
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Глобальна категорія
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Оновлення
                </th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-textMuted uppercase tracking-wider w-24">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          limit={LIMIT}
          onChange={setPage}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
