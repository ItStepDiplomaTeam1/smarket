import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
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
  { id: '', label: 'Всі категорії' },
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
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#003B2A]">Активний</span>;
  }
  if (status === 'Неактивний') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fce8e6] text-[#d93025] dark:bg-[#C30404] dark:text-[#400202]">Неактивний</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fef7e0] text-[#b08b00]">Потребує перевірки</span>;
};

const IssueBadge: React.FC<{ issue: string | null }> = ({ issue }) => {
  if (!issue) return <span className="text-textMuted">—</span>;
  
  if (issue === 'Видалено') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fce8e6] text-[#d93025] dark:bg-[#C30404] dark:text-[#400202]">{issue}</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#feefe6] text-[#e05a10] dark:bg-[#FD690D] dark:text-[#5E2B0A]">{issue}</span>;
};

const ProductRowSkeleton: React.FC = () => (
  <div className="animate-pulse grid grid-cols-[60px_1fr_130px_100px_100px_160px_120px_110px_90px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 rounded-2xl mb-3 h-[74px]">
    <div className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-md bg-secondary" />
    </div>
    <div className="min-w-0 pr-4 flex flex-col gap-1.5">
      <div className="h-3.5 w-48 rounded bg-secondary" />
      <div className="h-3 w-12 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-20 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-16 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-16 rounded bg-secondary" />
    </div>
    <div className="px-2 flex flex-col items-center justify-center gap-1">
      <div className="h-5 w-16 rounded-full bg-secondary" />
      <div className="h-3 w-12 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-5 w-16 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-16 rounded bg-secondary" />
    </div>
    <div className="flex items-center justify-center gap-2 pr-4">
      <div className="h-6 w-12 rounded bg-secondary" />
    </div>
  </div>
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
        <div className="absolute right-0 top-8 z-50 bg-white dark:bg-[#173B33] border border-border dark:border-[#4ADE80]/20 rounded-lg shadow-lg p-2 min-w-[160px]">
          <button
            disabled={isToggling}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-textMain dark:text-white hover:bg-secondary dark:hover:bg-[#112D24] rounded-md transition-colors disabled:opacity-50"
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

  // Debounce search query to perform search immediately without clicking search button
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearch(searchQuery);
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
  };

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

  // Query to get the absolute total products in the database (unfiltered)
  const { data: globalStats } = useProducts({
    page: 1,
    limit: 1,
  });

  const products = data?.hits || [];
  const totalHits = data?.total_hits || 0;
  const totalGlobalProducts = globalStats?.total_hits || 0;
  const totalPages = Math.ceil(totalHits / limit) || 1;

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
        <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full">
          <AlertCircle size={24} className="text-accentRed opacity-70" />
          <p className="text-sm text-textMuted font-medium text-center">
            Не вдалося завантажити товари.
            <br />
            <span className="text-xs">Перевірте підключення до пошукового сервісу.</span>
          </p>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
          Товарів не знайдено за вказаними фільтрами.
        </div>
      );
    }

    return products.map((product) => {
      const idStr = String(product.id);
      const title = product.title;
      const weightStr = product.weight ? `${product.weight} ${product.unit || ''}`.trim() : '—';
      const imageUrl = product.image_url || 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
      
      // Map to universal global category using main_category_id
      const globalCategory = CATEGORIES.find(c => c.id === String(product.main_category_id))?.label || 'Продукти харчування';

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
          className="grid grid-cols-[60px_1fr_130px_100px_100px_160px_120px_110px_90px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-border dark:hover:border-[#173B33]/30 transition-all mb-3"
        >
          {/* Column 1: Image */}
          <div className="flex items-center justify-center">
            <div className="w-11 h-11 rounded-lg border border-border overflow-hidden bg-white shrink-0 flex items-center justify-center p-1">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-9 h-9 object-contain" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png';
                }}
              />
            </div>
          </div>

          {/* Column 2: Title & Weight */}
          <div className="min-w-0 pr-4 flex flex-col">
            <span className="text-[13px] font-bold text-textMain dark:text-white leading-snug break-words line-clamp-2" title={title}>
              {title}
            </span>
            <span className="text-[10px] text-textMuted mt-0.5">{weightStr}</span>
          </div>

          {/* Column 3: Category */}
          <div className="text-sm text-textMuted px-2 text-center truncate">
            {globalCategory || <span className="text-textMuted/40">—</span>}
          </div>

          {/* Column 4: Retailer */}
          <div className="text-sm text-textMuted px-2 text-center truncate">
            {firstOffer?.store?.retail_chain || firstOffer?.store?.name || <span className="text-textMuted/40">—</span>}
          </div>

          {/* Column 5: Price */}
          <div className="text-sm font-semibold text-textMain dark:text-white px-2 text-center">
            {price && price > 0 ? `${price.toFixed(2)}` : <span className="text-textMuted/40">—</span>}
          </div>

          {/* Column 6: Status */}
          <div className="flex flex-col items-center justify-center gap-1 px-2">
            <StatusBadge status={statusStr} />
            <div 
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                product.is_hidden
                  ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                  : 'text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30'
              }`}
            >
              {product.is_hidden ? <EyeOff size={12} /> : <Eye size={12} />}
              {product.is_hidden ? 'Приховано' : 'Видимий'}
            </div>
          </div>

          {/* Column 7: Issue/Problem */}
          <div className="px-2 flex justify-center">
            <IssueBadge issue={issueStr} />
          </div>

          {/* Column 8: Update */}
          <div className="text-sm text-textMuted px-2 text-center">
            {`${(parseInt(idStr.substring(0, 4), 16) % 55) + 5} хв тому`}
          </div>

          {/* Column 9: Actions */}
          <div className="flex items-center justify-center gap-2 pr-4">
            <ProductActionsMenu product={product} toggleVisibility={toggleVisibility} isToggling={isTogglingVisibility} />
          </div>
        </div>
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
            value={isLoading ? 0 : totalGlobalProducts.toLocaleString('uk-UA')}
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
          value={isLoading ? 0 : totalGlobalProducts.toLocaleString('uk-UA')}
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
      <div className="w-full">
        {/* Mobile View Toolbar: Grid layout (hidden on md and up) */}
        <div className="grid md:hidden grid-cols-2 gap-x-3.5 gap-y-3 w-full animate-in fade-in p-[1px]">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Пошук товару</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Назва, артикул..." 
                className="w-full pl-3 pr-8 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60 dark:placeholder:text-[#94A3B8]"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-textMuted" />
              </div>
            </div>
          </form>

          {/* Select Category */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Категорія</label>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
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
          <div className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Статус</label>
            <div className="relative">
              <select 
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
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
          <div className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Магазин</label>
            <div className="relative">
              <select 
                value={selectedRetailer}
                onChange={(e) => {
                  setSelectedRetailer(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                {RETAILERS.map((ret) => (
                  <option key={ret.name} value={ret.name}>
                    {ret.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button (Mobile - takes full width) */}
          <button
            type="button"
            onClick={() => handleSearch()}
            className="col-span-2 h-[40px] w-full bg-white dark:bg-transparent border border-[#4ADE80] text-[#173B33] dark:text-[#4ADE80] rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap mt-1"
          >
            Пошук
          </button>
        </div>

        {/* Desktop View Toolbar: Flex layout (hidden on mobile) */}
        <div className="hidden md:flex flex-wrap items-end gap-3.5 w-full animate-in fade-in p-[1px]">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full sm:w-[340px]">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Пошук товару</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Назва, артикул, штрихкод..." 
                className="w-full pl-4 pr-10 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60 dark:placeholder:text-[#94A3B8]"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Search size={14} className="text-textMuted" />
              </div>
            </div>
          </form>

          {/* Select Category */}
          <div className="w-full md:w-auto">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Категорія</label>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[180px] pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Retailer */}
          <div className="w-full md:w-auto">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Магазин</label>
            <div className="relative">
              <select 
                value={selectedRetailer}
                onChange={(e) => {
                  setSelectedRetailer(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[160px] pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                {RETAILERS.map((ret) => (
                  <option key={ret.name} value={ret.name}>
                    {ret.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Status */}
          <div className="w-full md:w-auto">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Статус</label>
            <div className="relative">
              <select 
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-[150px] pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                {STATUSES.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => handleSearch()}
            className="h-[40px] px-8 bg-white dark:bg-transparent border border-[#4ADE80] text-[#173B33] dark:text-[#4ADE80] rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap self-end mb-[1px]"
          >
            Пошук
          </button>
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
            
            // Map to universal global category using main_category_id
            const globalCategory = CATEGORIES.find(c => c.id === String(product.main_category_id))?.label || 'Продукти харчування';

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
                className="bg-surface border border-border/60 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-none p-4 space-y-4"
              >
                {/* Header Row: Image, Title, Actions */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    <ProductActionsMenu product={product} toggleVisibility={toggleVisibility} isToggling={isTogglingVisibility} />
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                {/* Details Row: Category, Store, Price */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-textMuted">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-normal text-textMuted/60 uppercase tracking-wider">Категорія</span>
                    <span className="text-textMain dark:text-[#FFFFFF] truncate">{globalCategory || '—'}</span>
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
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        product.is_hidden
                          ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                          : 'text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30'
                      }`}
                    >
                      {product.is_hidden ? <EyeOff size={12} /> : <Eye size={12} />}
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
      <div className="hidden md:block w-full overflow-x-auto pb-2">
        <div className="min-w-[1000px] w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[60px_1fr_130px_100px_100px_160px_120px_110px_90px] items-center text-left w-full px-4 py-3 bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl mb-4 text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] uppercase tracking-wider shadow-sm animate-in fade-in">
            <div /> {/* Spacer for image */}
            <div className="pr-4">Товар</div>
            <div className="px-2 text-center">Категорія</div>
            <div className="px-2 text-center">Магазини</div>
            <div className="px-2 text-center">Ціна</div>
            <div className="px-2 text-center">Статус</div>
            <div className="px-2 text-center">Проблема</div>
            <div className="px-2 text-center">Оновлення</div>
            <div className="text-center pr-4">Дії</div>
          </div>

          {/* Rows container */}
          <div className="space-y-3 animate-in fade-in">
            {renderTableBody()}
          </div>
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
