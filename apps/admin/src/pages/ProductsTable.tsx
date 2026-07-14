import React, { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { useProducts, useToggleProductVisibility } from '@/hooks/useProducts';
import { MetricCard } from '@/components/MetricCard';

import PackageIcon from '@/assets/MetricCardIcons/Package.svg';
import SearchIcon from '@/assets/MetricCardIcons/Search.svg';
import RowsIcon from '@/assets/MetricCardIcons/Rows.svg';
import TagIcon from '@/assets/MetricCardIcons/Tag.svg';
import BinIcon from '@/assets/MetricCardIcons/Bin.svg';

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '', label: 'Всі глобальні категорії' },
  { id: '1', label: 'Продукти харчування' },
  { id: '2', label: 'Напої' },
  { id: '3', label: 'Солодощі та снеки' },
  { id: '4', label: 'Алкоголь та тютюн' },
  { id: '5', label: 'Товари для дому та побуту' },
  { id: '6', label: 'Краса та догляд' },
  { id: '7', label: 'Зоотовари' },
  { id: '8', label: 'Дитячі товари' },
  { id: '9', label: 'Хобі та відпочинок' },
  { id: '10', label: 'Акції та промо' },
];

const RETAILERS = [
  { name: '', label: 'Всі магазини' },
  { name: 'АТБ', label: 'АТБ' },
  { name: 'Сільпо', label: 'Сільпо' },
  { name: 'Novus', label: 'Novus' },
  { name: 'Metro', label: 'Metro' },
  { name: 'Ашан', label: 'Ашан' },
];

const STATUSES = [
  { value: '', label: 'Всі статуси' },
  { value: 'active', label: 'Активний' },
  { value: 'inactive', label: 'Неактивний' },
];

// ── Helper Components ─────────────────────────────────────────────────────



const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Активний') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e]">Активний</span>;
  }
  if (status === 'Неактивний') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fce8e6] text-[#d93025]">Неактивний</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fef7e0] text-[#b08b00]">Потребує перевірки</span>;
};

const IssueBadge: React.FC<{ issue: string | null }> = ({ issue }) => {
  if (!issue) return <span className="text-textMuted">—</span>;
  
  if (issue === 'Видалено') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fce8e6] text-[#d93025]">{issue}</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#feefe6] text-[#e05a10]">{issue}</span>;
};

const ProductRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="py-4 pl-6 pr-3 w-12">
      <div className="w-4 h-4 bg-secondary rounded" />
    </td>
    <td className="py-4 px-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-secondary shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3.5 w-48 rounded bg-secondary" />
          <div className="h-3 w-12 rounded bg-secondary" />
        </div>
      </div>
    </td>
    <td className="py-4 px-3">
      <div className="h-4 w-20 rounded bg-secondary" />
    </td>
    <td className="py-4 px-3">
      <div className="h-4 w-16 rounded bg-secondary" />
    </td>
    <td className="py-4 px-3">
      <div className="h-5 w-14 rounded-full bg-secondary" />
    </td>
    <td className="py-4 px-3">
      <div className="h-5 w-16 rounded bg-secondary" />
    </td>
    <td className="py-4 px-3">
      <div className="h-5 w-16 rounded bg-secondary" />
    </td>
    <td className="py-4 px-3 text-right">
      <div className="h-4 w-16 rounded bg-secondary inline-block" />
    </td>
    <td className="py-4 pl-3 pr-6 text-right">
      <div className="h-6 w-12 rounded bg-secondary inline-block" />
    </td>
  </tr>
);

const ProductActionsMenu: React.FC<{ product: any, toggleVisibility: any, isToggling: boolean }> = ({ product, toggleVisibility, isToggling }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary rounded-md transition-colors"
        title="Більше дій"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
          <button
            disabled={isToggling}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-textMain hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
            onClick={() => {
              toggleVisibility({ productId: product.id, isHidden: !product.is_hidden });
              setOpen(false);
            }}
          >
            {product.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
            {product.is_hidden ? 'Показати' : 'Приховати'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

const ProductsTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { mutate: toggleVisibility, isPending: isTogglingVisibility } = useToggleProductVisibility();

  const limit = 10;
  const { data, isLoading, isError } = useProducts({
    q: activeSearch,
    page,
    limit,
    mainCategoryId: selectedCategory || undefined,
    retailChain: selectedRetailer || undefined,
    inStock: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
  });

  const products = data?.hits || [];
  const totalHits = data?.total_hits || 0;
  const totalPages = Math.ceil(totalHits / limit) || 1;

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => String(p.id))));
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

  const getPageNumbers = () => {
    const pages = [];
    const siblingCount = 1;
    
    pages.push(1);
    
    const leftSiblingIndex = Math.max(page - siblingCount, 2);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages - 1);
    
    if (leftSiblingIndex > 2) {
      pages.push('...');
    }
    
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }
    
    if (rightSiblingIndex < totalPages - 1) {
      pages.push('...');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <ProductRowSkeleton key={i} />
      ));
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={9} className="py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-accentRed opacity-70" />
              <p className="text-sm text-textMuted font-medium">
                Не вдалося завантажити товари.
                <br />
                <span className="text-xs">Перевірте підключення до пошукового сервісу.</span>
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (products.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="py-8 text-center text-sm text-textMuted font-medium">
            Товарів не знайдено за вказаними фільтрами.
          </td>
        </tr>
      );
    }

    return products.map((product) => {
      const idStr = String(product.id);
      const title = product.title;
      const weightStr = product.weight ? `${product.weight} ${product.unit || ''}`.trim() : '—';
      const imageUrl = product.image_url || 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
      const categoryName = product.category_name || '';

      const firstOffer = product.offers?.[0];
      const price = firstOffer?.price;
      const inStock = firstOffer?.in_stock ?? false;

      let statusStr = 'Неактивний';
      if (inStock && price && price > 0) {
        statusStr = 'Активний';
      } else if (!price || price <= 0) {
        statusStr = 'Потребують перевірки';
      }

      let issueStr: string | null = null;
      if (!price || price <= 0) {
        issueStr = 'Без ціни';
      } else if (!product.category_name) {
        issueStr = 'Без категорії';
      }

      return (
        <tr key={idStr} className="hover:bg-secondary/40 transition-colors group">
          <td className="py-4 pl-6 pr-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
              checked={selectedIds.has(idStr)}
              onChange={() => toggleSelect(idStr)}
            />
          </td>
          <td className="py-4 px-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md border border-border overflow-hidden bg-white shrink-0 flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-8 h-8 object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
                  }}
                />
              </div>
              <div className="flex flex-col max-w-[240px] sm:max-w-[280px] lg:max-w-[320px]">
                <span className="text-[13px] font-semibold text-textMain truncate" title={title}>
                  {title}
                </span>
                <span className="text-[11px] text-textMuted mt-0.5">{weightStr}</span>
              </div>
            </div>
          </td>
          <td className="py-4 px-3 text-sm text-textMuted text-center">
            {categoryName || <span className="text-textMuted/50">—</span>}
          </td>
          <td className="py-4 px-3 text-sm font-medium text-textMain text-center whitespace-nowrap">
            {price && price > 0 ? (
              <div className="flex flex-col items-center">
                <span className="whitespace-nowrap">від {price.toFixed(2)} грн</span>
                {firstOffer?.store?.name && (
                  <span 
                    className="text-[10px] text-textMuted font-normal block max-w-[180px] truncate mt-0.5" 
                    title={`${firstOffer.store.name} (${firstOffer.store.retail_chain || ''})`}
                  >
                    {firstOffer.store.name}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-textMuted/50">—</span>
            )}
          </td>
          <td className="py-4 px-3 text-center">
            <div className="flex flex-col gap-1.5 items-center">
              <StatusBadge status={statusStr} />
              <div 
                className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                  product.is_hidden
                    ? 'text-red-600 bg-red-50 border border-red-100'
                    : 'text-green-600 bg-green-50 border border-green-100'
                }`}
                title={product.is_hidden ? 'Приховано від клієнтів' : 'Видимо для клієнтів'}
              >
                {product.is_hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                {product.is_hidden ? 'Приховано' : 'Видимий'}
              </div>
            </div>
          </td>
          <td className="py-4 px-3 text-center">
            <IssueBadge issue={issueStr} />
          </td>
          <td className="py-4 px-3 text-sm text-textMuted text-center whitespace-nowrap">
            Нещодавно
          </td>
          <td className="py-4 px-3 text-center">
            <div className="flex items-center justify-center">
              <ProductActionsMenu product={product} toggleVisibility={toggleVisibility} isToggling={isTogglingVisibility} />
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-12 px-4 md:px-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-textMuted uppercase tracking-wider">
        <span>Головна</span>
        <span className="text-textMuted/60 font-normal">/</span>
        <span className="text-textMain">Товари</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="font-manrope text-[24px] md:text-[28px] font-bold text-textMain leading-tight">Товари</h1>
      </div>

      {/* ── Top Metrics Grid: Mobile view (visible on small screens) ── */}
      <div className="space-y-3 md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Всього товарів"
            value={isLoading ? 0 : totalHits.toLocaleString('uk-UA')}
            icon={PackageIcon}
            iconBgColor="#6FE3C2"
          />
          <MetricCard
            title="Потребують перевірки"
            value={15}
            icon={SearchIcon}
            iconBgColor="#FD690D"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            title="Без ціни"
            value={8}
            icon={TagIcon}
            iconBgColor="#1A65F2"
            className="p-3"
          />
          <MetricCard
            title="Неактивні"
            value={5}
            icon={BinIcon}
            iconBgColor="#C30404"
            className="p-3"
          />
          <MetricCard
            title="Без категорії"
            value={12}
            icon={RowsIcon}
            iconBgColor="#FDC80D"
            className="p-3"
          />
        </div>
      </div>

      {/* ── Top Metrics Grid: Desktop view (visible on md and up) ── */}
      <div className="hidden md:grid md:grid-cols-5 gap-4">
        <MetricCard
          title="Всього товарів"
          value={isLoading ? 0 : totalHits.toLocaleString('uk-UA')}
          icon={PackageIcon}
          iconBgColor="#6FE3C2"
        />
        <MetricCard
          title="Потребують перевірки"
          value={15}
          icon={SearchIcon}
          iconBgColor="#FD690D"
        />
        <MetricCard
          title="Без категорії"
          value={12}
          icon={RowsIcon}
          iconBgColor="#FDC80D"
        />
        <MetricCard
          title="Без ціни"
          value={8}
          icon={TagIcon}
          iconBgColor="#1A65F2"
        />
        <MetricCard
          title="Неактивні"
          value={5}
          icon={BinIcon}
          iconBgColor="#C30404"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-surface border border-border p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-3 w-full">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="col-span-2 md:col-span-1 w-full md:w-auto">
            <label className="block text-[11px] md:text-xs font-semibold text-textMain mb-1.5 ml-1">Пошук товару</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 md:pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-textMuted" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Назва, артикул..." 
                className="w-full md:w-[220px] pl-8 md:pl-9 pr-3 md:pr-4 py-2 bg-surface border border-border rounded-lg text-xs md:text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-textMuted"
              />
            </div>
          </form>

          {/* Select Category */}
          <div className="col-span-1 w-full md:w-auto">
            <label className="block text-[11px] md:text-xs font-semibold text-textMain mb-1.5 ml-1">Категорія</label>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[180px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-xs md:text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.1em_1.1em]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Status */}
          <div className="col-span-1 w-full md:w-auto">
            <label className="block text-[11px] md:text-xs font-semibold text-textMain mb-1.5 ml-1">Статус</label>
            <div className="relative">
              <select 
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[150px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-xs md:text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.1em_1.1em]"
              >
                {STATUSES.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Retailer */}
          <div className="col-span-1 w-full md:w-auto">
            <label className="block text-[11px] md:text-xs font-semibold text-textMain mb-1.5 ml-1">Магазин</label>
            <div className="relative">
              <select 
                value={selectedRetailer}
                onChange={(e) => {
                  setSelectedRetailer(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[150px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-xs md:text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.1em_1.1em]"
              >
                {RETAILERS.map((ret) => (
                  <option key={ret.name} value={ret.name}>
                    {ret.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="col-span-1 w-full md:w-auto flex flex-col justify-end">
            <label className="block text-[11px] md:text-xs font-semibold text-transparent mb-1.5 select-none">&nbsp;</label>
            <button 
              onClick={() => {
                setActiveSearch(searchQuery);
                setPage(1);
              }}
              className="w-full md:w-auto h-[38px] px-5 py-2 border border-primary/40 text-primary dark:text-[#4ADE80] dark:border-[#4ADE80]/40 rounded-lg text-xs md:text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Пошук
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile View: list of product cards (visible on small screens) ── */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-surface border border-border/50 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-secondary rounded" />
                <div className="w-12 h-12 bg-secondary rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-full rounded bg-secondary" />
                  <div className="h-3 w-16 rounded bg-secondary" />
                </div>
              </div>
              <div className="h-px bg-border/40" />
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><div className="h-2 w-10 bg-secondary rounded" /><div className="h-3 w-16 bg-secondary rounded" /></div>
                <div className="space-y-1"><div className="h-2 w-10 bg-secondary rounded" /><div className="h-3 w-12 bg-secondary rounded" /></div>
                <div className="space-y-1"><div className="h-2 w-10 bg-secondary rounded" /><div className="h-3 w-14 bg-secondary rounded" /></div>
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl">
            <AlertCircle size={24} className="text-accentRed mx-auto mb-2 opacity-85" />
            <p className="text-sm text-textMuted font-medium">Не вдалося завантажити товари</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl text-sm text-textMuted">
            Товарів не знайдено за вказаними фільтрами
          </div>
        ) : (
          products.map((product) => {
            const idStr = String(product.id);
            const title = product.title;
            const weightStr = product.weight ? `${product.weight} ${product.unit || ''}`.trim() : '—';
            const imageUrl = product.image_url || 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
            const categoryName = product.category_name || '';

            const firstOffer = product.offers?.[0];
            const price = firstOffer?.price;
            const inStock = firstOffer?.in_stock ?? false;

            let statusStr = 'Неактивний';
            if (inStock && price && price > 0) {
              statusStr = 'Активний';
            } else if (!price || price <= 0) {
              statusStr = 'Потребують перевірки';
            }

            let issueStr: string | null = null;
            if (!price || price <= 0) {
              issueStr = 'Без ціни';
            } else if (!product.category_name) {
              issueStr = 'Без категорії';
            }

            return (
              <div
                key={idStr}
                className="bg-surface border border-border/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-none p-4 space-y-4"
              >
                {/* Header Row: Checkbox, Image, Title, Actions */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731] shrink-0"
                      checked={selectedIds.has(idStr)}
                      onChange={() => toggleSelect(idStr)}
                    />
                    <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-white shrink-0 flex items-center justify-center p-1">
                      <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-10 h-10 object-contain" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-textMain dark:text-[#FFFFFF] leading-snug break-words line-clamp-2" title={title}>
                        {title}
                      </span>
                      <span className="text-[10px] text-textMuted mt-0.5">{weightStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary dark:hover:bg-secondary/40 rounded-md transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <ProductActionsMenu product={product} toggleVisibility={toggleVisibility} isToggling={isTogglingVisibility} />
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Details Row: Category, Store, Price */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-textMuted">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-normal text-textMuted/60 uppercase tracking-wider">Категорія</span>
                    <span className="text-textMain dark:text-[#FFFFFF] truncate">{categoryName || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-normal text-textMuted/60 uppercase tracking-wider">Магазин</span>
                    <span className="text-textMain dark:text-[#FFFFFF] truncate">{firstOffer?.store?.name || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-normal text-textMuted/60 uppercase tracking-wider">Ціна</span>
                    <span className="text-textMain dark:text-[#FFFFFF]">{price && price > 0 ? `${price.toFixed(2)} грн` : '—'}</span>
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Badges & Time Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge status={statusStr} />
                    {issueStr && <IssueBadge issue={issueStr} />}
                    <div 
                      className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                        product.is_hidden
                          ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                          : 'text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30'
                      }`}
                    >
                      {product.is_hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                      {product.is_hidden ? 'Приховано' : 'Видимий'}
                    </div>
                  </div>
                  <span className="text-[10px] text-textMuted font-medium">Нещодавно</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop View: Data Table (hidden on mobile) ── */}
      <div className="hidden md:block bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-4 pl-6 pr-3 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain w-[32%]">Товар</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[14%]">Категорія</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[19%]">Ціна</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[10%]">Статус</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[10%]">Проблема</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[10%]">Оновлення</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-center w-[5%]">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-textMuted font-medium">
          Показано <span className="text-textMain">
            {totalHits === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, totalHits)}
          </span> з <span className="text-textMain">{totalHits}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-textMuted hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft size={16} />
          </button>
          
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-textMuted">
                  ...
                </span>
              );
            }
            const pageNum = p as number;
            return (
              <button 
                key={`page-${pageNum}`}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition-colors
                  ${page === pageNum 
                    ? 'border-[#1a4731] bg-[#e8f1ec] text-[#1a4731]' 
                    : 'border-transparent text-textMuted hover:bg-secondary'}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-textMuted hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductsTable;
