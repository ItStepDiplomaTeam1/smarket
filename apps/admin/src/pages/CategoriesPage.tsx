import React, { useState } from 'react';
import { Search, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useCategories, useToggleCategoryVisibility } from '@/hooks/useCategories';

import alcoholsIcon from '@/assets/CategoryIcons/Alcohols.svg';
import childrenIcon from '@/assets/CategoryIcons/Children.svg';
import drinksIcon from '@/assets/CategoryIcons/Drinks.svg';
import groceriesIcon from '@/assets/CategoryIcons/Groceries.svg';
import householdIcon from '@/assets/CategoryIcons/Household.svg';
import personalCareIcon from '@/assets/CategoryIcons/PersonalCare.svg';
import petsIcon from '@/assets/CategoryIcons/Pets.svg';
import productsIcon from '@/assets/CategoryIcons/Products.svg';

const CATEGORY_ICONS: Record<number, string> = {
  1: groceriesIcon,    // Продукти харчування
  2: drinksIcon,       // Напої
  3: alcoholsIcon,     // Алкоголь
  4: childrenIcon,     // Для дітей
  5: petsIcon,         // Зоотовари
  6: personalCareIcon, // Краса та здоров'я
  7: householdIcon,    // Дім та побут
  8: productsIcon,     // Одяг та взуття
  9: productsIcon,     // Дача, сад, город
  10: productsIcon,    // Канцелярія та книги
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
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary" />
        <div className="h-4 w-40 rounded bg-secondary" />
      </div>
    </td>
    <td className="py-4 px-3"><div className="h-5 w-16 rounded bg-secondary" /></td>
    <td className="py-4 px-3 text-center"><div className="h-5 w-8 rounded bg-secondary inline-block" /></td>
  </tr>
);

const CategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: categories = [], isLoading, isError } = useCategories();
  const { mutate: toggleVisibility, isPending: isToggling } = useToggleCategoryVisibility();

  // Локальна фільтрація
  const filtered = categories.filter((c) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isHidden = c.is_hidden ?? false;
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === 'active' && !isHidden) ||
      (selectedStatus === 'hidden' && isHidden);
    return matchesSearch && matchesStatus;
  });

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => <CategoryRowSkeleton key={i} />);
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={3} className="py-12 text-center">
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

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="py-12 text-center text-sm text-textMuted font-medium">
            Категорій не знайдено.
          </td>
        </tr>
      );
    }

    return filtered.map((category) => (
      <tr
        key={category.id}
        className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0"
      >
        <td className="py-4 pl-6 pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e6f4ea] dark:bg-emerald-950/40 flex items-center justify-center p-1.5 shrink-0">
              <img src={CATEGORY_ICONS[category.id] || productsIcon} alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-textMain">{category.name}</span>
          </div>
        </td>
        <td className="py-4 px-3">
          <StatusBadge isHidden={category.is_hidden} />
        </td>
        <td className="py-4 px-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => {
                if(confirm(`Ви впевнені, що хочете ${category.is_hidden ? 'показати' : 'приховати'} глобальну категорію "${category.name}"?\n\nЦе змінить статус ВСІХ вкладених підкатегорій та товарів.`)) {
                  toggleVisibility({ categoryId: category.id, isHidden: !category.is_hidden });
                }
              }}
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
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Глобальні Категорії</h1>
        <p className="text-sm text-textMuted mt-0.5">Управління видимостями 10 верхньорівневих категорій</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium">Пошук</span>
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
              <input
                type="text"
                placeholder="Пошук..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] pl-8 pr-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-textMuted"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
            <span className="text-sm text-textMuted font-medium">Статус</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-[38px] px-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] min-w-[140px] w-full sm:w-auto"
            >
              <option value="">Всі статуси</option>
              <option value="active">Активна</option>
              <option value="hidden">Прихована</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 pl-6 pr-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Назва категорії
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Статус
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
    </div>
  );
};

export default CategoriesPage;
