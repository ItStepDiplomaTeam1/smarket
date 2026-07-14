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
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f3f4f6] text-[#4b5563] dark:bg-[#757877] dark:text-[#ffffff]">
        Прихована
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#173b33]">
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
  const { data: categories = [], isLoading, isError } = useCategories();
  const { mutate: toggleVisibility, isPending: isToggling } = useToggleCategoryVisibility();

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

    if (categories.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="py-12 text-center text-sm text-textMuted font-medium">
            Категорій не знайдено.
          </td>
        </tr>
      );
    }

    return categories.map((category) => (
      <tr
        key={category.id}
        className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0"
      >
        <td className="py-4 pl-6 pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e6f4ea] dark:bg-[#173B33] flex items-center justify-center shrink-0 p-1.5">
              <img 
                src={CATEGORY_ICONS[category.id] || productsIcon} 
                alt="" 
                className="w-full h-full object-contain dark:[filter:brightness(0)_invert(72%)_sepia(35%)_saturate(836%)_hue-rotate(81deg)_brightness(108%)_contrast(92%)]" 
              />
            </div>
            <span className="text-sm font-semibold text-textMain dark:text-[#FFFFFF]">{category.name}</span>
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
    <div className="space-y-4 animate-in fade-in duration-500 pb-12 px-4 md:px-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-textMuted uppercase tracking-wider">
        <span>Головна</span>
        <span className="text-textMuted/60 font-normal">/</span>
        <span className="text-textMain">Категорії</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-manrope text-[24px] md:text-[28px] font-bold text-textMain leading-tight">Категорії</h1>
      </div>

      {/* Mobile View: list of cards (visible on small screens) */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-surface border border-border/50 rounded-2xl h-[72px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-secondary" />
                  <div className="h-3 w-16 rounded bg-secondary" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-secondary" />
            </div>
          ))
        ) : isError ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl">
            <AlertCircle size={24} className="text-[#c5221f] mx-auto mb-2 opacity-85" />
            <p className="text-sm text-textMuted font-medium">Не вдалося завантажити категорії</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl text-sm text-textMuted">
            Категорій не знайдено
          </div>
        ) : (
          categories.map((category) => {
            const isActive = !category.is_hidden;
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-surface border border-border/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e6f4ea] dark:bg-[#173B33] flex items-center justify-center shrink-0 p-2">
                    <img 
                      src={CATEGORY_ICONS[category.id] || productsIcon} 
                      alt="" 
                      className="w-full h-full object-contain dark:[filter:brightness(0)_invert(72%)_sepia(35%)_saturate(836%)_hue-rotate(81deg)_brightness(108%)_contrast(92%)]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-textMain dark:text-[#FFFFFF] leading-tight">{category.name}</span>
                    <div>
                      <StatusBadge isHidden={category.is_hidden} />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (confirm(`Ви впевнені, що хочете ${category.is_hidden ? 'показати' : 'приховати'} глобальну категорію "${category.name}"?\n\nЦе змінить статус ВСІХ вкладених підкатегорій та товарів.`)) {
                        toggleVisibility({ categoryId: category.id, isHidden: !category.is_hidden });
                      }
                    }}
                    disabled={isToggling}
                    className={`p-2 rounded-xl border border-border/80 transition-colors ${
                      category.is_hidden
                        ? 'text-textMuted hover:text-textMain hover:bg-secondary bg-surface'
                        : 'text-textMuted hover:text-[#c5221f] hover:bg-[#c5221f]/10 bg-surface'
                    } disabled:opacity-50`}
                  >
                    {category.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop View: Table (hidden on mobile, visible on md and up) */}
      <div className="hidden md:block bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 pl-6 pr-3 text-xs font-semibold text-textMuted dark:text-[#FFFFFF] uppercase tracking-wider">
                  Назва категорії
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted dark:text-[#FFFFFF] uppercase tracking-wider">
                  Статус
                </th>
                <th className="py-3 px-3 text-center text-xs font-semibold text-textMuted dark:text-[#FFFFFF] uppercase tracking-wider w-24">
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
