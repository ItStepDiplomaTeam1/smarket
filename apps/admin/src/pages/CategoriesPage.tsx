import React from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
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
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f3f4f6] text-[#4b5563] dark:bg-[#C30404] dark:text-[#400202]">
        Прихована
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#003B2A]">
      Активна
    </span>
  );
};



const CategoriesPage: React.FC = () => {
  const { data: categories = [], isLoading, isError } = useCategories();
  const { mutate: toggleVisibility, isPending: isToggling } = useToggleCategoryVisibility();

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse grid grid-cols-[1fr_180px_100px] items-center text-left w-full px-6 py-3 bg-surface border border-border/70 rounded-2xl mb-3 h-[68px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary" />
            <div className="h-4 w-32 rounded bg-secondary" />
          </div>
          <div className="px-2 flex justify-center">
            <div className="h-5 w-16 rounded-full bg-secondary" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-8 rounded bg-secondary" />
          </div>
        </div>
      ));
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full">
          <AlertCircle size={24} className="text-accentRed opacity-70" />
          <p className="text-sm text-textMuted font-medium text-center">
            Не вдалося завантажити категорії.
          </p>
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
          Категорій не знайдено.
        </div>
      );
    }

    return categories.map((category) => (
      <div
        key={category.id}
        className="grid grid-cols-[1fr_180px_100px] items-center text-left w-full px-6 py-3 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-border dark:hover:border-[#173B33]/30 transition-all mb-3"
      >
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
        <div className="px-2 flex justify-center">
          <StatusBadge isHidden={category.is_hidden} />
        </div>
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => {
              if (confirm(`Ви впевнені, що хочете ${category.is_hidden ? 'показати' : 'приховати'} глобальну категорію "${category.name}"?\n\nЦе змінить статус ВСІХ вкладених підкатегорій та товарів.`)) {
                toggleVisibility({ categoryId: category.id, isHidden: !category.is_hidden });
              }
            }}
            disabled={isToggling}
            className={`p-1.5 rounded-md transition-colors ${
              category.is_hidden
                ? 'text-textMuted hover:text-textMain hover:bg-secondary dark:text-[#4ADE80] dark:hover:bg-[#4ADE80]/10'
                : 'text-textMuted hover:text-[#c5221f] hover:bg-[#c5221f]/10 dark:text-[#4ADE80] dark:hover:bg-[#4ADE80]/10'
            } disabled:opacity-50`}
            title={category.is_hidden ? 'Показати' : 'Приховати'}
          >
            {category.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
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
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-surface border border-border/60 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-md transition-shadow duration-200"
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
                    className={`p-2 rounded-xl border border-border/80 dark:border-[#4ADE80]/30 transition-colors ${
                      category.is_hidden
                        ? 'text-textMuted hover:text-textMain hover:bg-secondary bg-surface dark:text-[#4ADE80] dark:hover:bg-[#4ADE80]/10'
                        : 'text-textMuted hover:text-[#c5221f] hover:bg-[#c5221f]/10 bg-surface dark:text-[#4ADE80] dark:hover:bg-[#4ADE80]/10'
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
      <div className="hidden md:block w-full overflow-x-auto pb-2">
        <div className="min-w-[800px] w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_180px_100px] items-center text-left w-full px-6 py-3 bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl mb-4 text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] uppercase tracking-wider shadow-sm animate-in fade-in">
            <div>Назва категорії</div>
            <div className="text-center">Статус</div>
            <div className="text-center">Дії</div>
          </div>

          {/* Rows container */}
          <div className="space-y-3 animate-in fade-in">
            {renderBody()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
