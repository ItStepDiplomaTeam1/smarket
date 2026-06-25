import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Menu, 
  Tag, 
  Trash, 
  Edit, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ProductMock {
  id: string;
  name: string;
  weight: string;
  imageUrl: string;
  category: string;
  priceStart: number;
  retailerCount: number;
  status: 'Активний' | 'Неактивний' | 'Потребують перевірки';
  issue: 'Без ціни' | 'Видалено' | 'Без категорії' | null;
  updatedAt: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────

const mockProducts: ProductMock[] = [
  {
    id: 'PRD-001',
    name: 'Чипси Pringles Sour Cream & Onion Сметана та цибуля',
    weight: '165 г',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/2c5bd4d9-dcda-43c2-a7d0-120f2b3e8392.png',
    category: 'Снеки',
    priceStart: 54.49,
    retailerCount: 3,
    status: 'Активний',
    issue: null,
    updatedAt: '5 хв тому',
  },
  {
    id: 'PRD-002',
    name: 'Молоко Яготинське пастеризоване 2,6%',
    weight: '870г',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/4d5b2447-d57b-4899-b14e-eb7eb8c9d46d.png',
    category: 'Молочні продукти',
    priceStart: 38.90,
    retailerCount: 0,
    status: 'Потребують перевірки',
    issue: 'Без ціни',
    updatedAt: '12 хв тому',
  },
  {
    id: 'PRD-003',
    name: 'Вино Marlborough Sun Sauvignon Blanc',
    weight: '0,75л',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/7d7a4650-70f2-45e6-b9ab-5909ff7b2b07.png',
    category: 'Алкоголь',
    priceStart: 469.00,
    retailerCount: 2,
    status: 'Активний',
    issue: null,
    updatedAt: '18 хв тому',
  },
  {
    id: 'PRD-004',
    name: 'Макаронні вироби La Pasta ріжки',
    weight: '400 г',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/86720d2b-10e5-42d4-a82d-8e6f33d45c50.png',
    category: 'Бакалія',
    priceStart: 38.00,
    retailerCount: 4,
    status: 'Активний',
    issue: null,
    updatedAt: '25 хв тому',
  },
  {
    id: 'PRD-005',
    name: 'Асорті Parmiamo Антіпасто нарізка',
    weight: '90г',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/e3ea9768-3e4b-4835-ab32-d1be8e95079a.png',
    category: 'Бакалія',
    priceStart: 243.00,
    retailerCount: 1,
    status: 'Неактивний',
    issue: 'Видалено',
    updatedAt: '35 хв тому',
  },
  {
    id: 'PRD-006',
    name: 'Закваска 2.5% Яготинська',
    weight: '900г',
    imageUrl: 'https://images.silpo.ua/products/1600x1600/webp/a755d7f1-799d-4876-8869-7becc4a6d0c4.png',
    category: '',
    priceStart: 68.40,
    retailerCount: 2,
    status: 'Потребують перевірки',
    issue: 'Без категорії',
    updatedAt: '39 хв тому',
  },
];

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

const StatusBadge: React.FC<{ status: ProductMock['status'] }> = ({ status }) => {
  if (status === 'Активний') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#e6f4ea] text-[#1e8e3e]">Активний</span>;
  }
  if (status === 'Неактивний') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fce8e6] text-[#d93025]">Неактивний</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fef7e0] text-[#b08b00]">Потребує перевірки</span>;
};

const IssueBadge: React.FC<{ issue: ProductMock['issue'] }> = ({ issue }) => {
  if (!issue) return <span className="text-textMuted">—</span>;
  
  if (issue === 'Видалено') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fce8e6] text-[#d93025]">{issue}</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#feefe6] text-[#e05a10]">{issue}</span>;
};

// ── Main Component ────────────────────────────────────────────────────────

const ProductsTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === mockProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mockProducts.map(p => p.id)));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ── Page Header ── */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Товари</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Товари</p>
      </div>

      {/* ── Top Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="Всього товарів" 
          value={60} 
          icon={ShoppingBag} 
          iconBg="bg-[#e6f4ea]" 
          iconColor="text-[#1e8e3e]"
          trendText="5.2% від учора"
          trendPositive={true}
        />
        <MetricCard 
          title="Потребують перевірки" 
          value={15} 
          icon={Search} 
          iconBg="bg-[#feefe6]" 
          iconColor="text-[#e05a10]"
          trendText="7.5% від учора"
          trendPositive={true}
        />
        <MetricCard 
          title="Без категорії" 
          value={12} 
          icon={Menu} 
          iconBg="bg-[#fef7e0]" 
          iconColor="text-[#b08b00]"
          trendText="1.2% від учора"
          trendPositive={false}
        />
        <MetricCard 
          title="Без ціни" 
          value={8} 
          icon={Tag} 
          iconBg="bg-[#e8f0fe]" 
          iconColor="text-[#1a73e8]"
          trendText="2.3% від учора"
          trendPositive={false}
        />
        <MetricCard 
          title="Неактивні" 
          value={5} 
          icon={Trash} 
          iconBg="bg-[#fce8e6]" 
          iconColor="text-[#d93025]"
          trendText="1.4% від учора"
          trendPositive={false}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-textMain mb-1.5 ml-1">Пошук товару</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-textMuted" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Назва, артикул, штрихкод..." 
                className="w-full sm:w-[220px] pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-textMuted"
              />
            </div>
          </div>

          {/* Select Category */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-textMain mb-1.5 ml-1">Категорія</label>
            <div className="relative">
              <select className="w-full sm:w-[150px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                <option>Всі категорії</option>
                <option>Снеки</option>
                <option>Молочні продукти</option>
                <option>Алкоголь</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className="text-textMuted" />
              </div>
            </div>
          </div>

          {/* Select Retailer */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-textMain mb-1.5 ml-1">Магазин</label>
            <div className="relative">
              <select className="w-full sm:w-[150px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                <option>Всі магазини</option>
                <option>АТБ</option>
                <option>Сільпо</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className="text-textMuted" />
              </div>
            </div>
          </div>

          {/* Select Status */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-textMain mb-1.5 ml-1">Статус</label>
            <div className="relative">
              <select className="w-full sm:w-[150px] pl-3 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-textMain appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                <option>Всі статуси</option>
                <option>Активний</option>
                <option>Неактивний</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className="text-textMuted" />
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto self-end mt-4 sm:mt-0">
             <button className="h-[38px] px-5 py-2 border border-border rounded-lg text-sm font-medium text-textMain hover:bg-secondary transition-colors w-full sm:w-auto">
              Пошук
            </button>
          </div>
        </div>

        <button className="h-[38px] flex items-center justify-center gap-2 px-5 py-2 bg-[#1a4731] hover:bg-[#133524] text-white rounded-lg text-sm font-medium transition-colors w-full lg:w-auto">
          <Plus size={16} />
          <span>Додати товар</span>
        </button>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-4 pl-6 pr-3 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
                    checked={selectedIds.size === mockProducts.length && mockProducts.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain">Товар</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain">Категорія</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain">Ціна</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain">Статус</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain">Проблема</th>
                <th className="py-4 px-3 text-xs font-semibold text-textMain text-right">Оновлення</th>
                <th className="py-4 pl-3 pr-6 text-xs font-semibold text-textMain text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/40 transition-colors group">
                  <td className="py-4 pl-6 pr-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border text-[#1a4731] focus:ring-[#1a4731]"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md border border-border overflow-hidden bg-white shrink-0 flex items-center justify-center">
                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-contain" />
                      </div>
                      <div className="flex flex-col max-w-[280px]">
                        <span className="text-sm font-semibold text-textMain truncate" title={product.name}>
                          {product.name}
                        </span>
                        <span className="text-xs text-textMuted">{product.weight}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-sm text-textMuted">
                    {product.category || <span className="text-textMuted/50">—</span>}
                  </td>
                  <td className="py-4 px-3 text-sm font-medium text-textMain">
                    {product.retailerCount > 0 ? (
                      <div className="flex flex-col">
                        <span>від {product.priceStart.toFixed(2)} грн</span>
                        <span className="text-[11px] text-textMuted font-normal">{product.retailerCount} {product.retailerCount === 1 ? 'пропозиція' : product.retailerCount >= 2 && product.retailerCount <= 4 ? 'пропозиції' : 'пропозицій'}</span>
                      </div>
                    ) : (
                      <span className="text-textMuted/50">—</span>
                    )}
                  </td>
                  <td className="py-4 px-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="py-4 px-3">
                    <IssueBadge issue={product.issue} />
                  </td>
                  <td className="py-4 px-3 text-sm text-textMuted text-right whitespace-nowrap">
                    {product.updatedAt}
                  </td>
                  <td className="py-4 pl-3 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-textMuted hover:text-primary hover:bg-secondary rounded-md transition-colors" title="Редагувати">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-textMuted hover:text-accentRed hover:bg-accentRed/10 rounded-md transition-colors" title="Видалити">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-textMuted font-medium">
          Показано <span className="text-textMain">1-6</span> з <span className="text-textMain">60</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-textMuted hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[1, 2, 3, 4].map(p => (
            <button 
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition-colors
                ${page === p 
                  ? 'border-[#1a4731] bg-[#e8f1ec] text-[#1a4731]' 
                  : 'border-transparent text-textMuted hover:bg-secondary'}`}
            >
              {p}
            </button>
          ))}
          
          <span className="w-8 h-8 flex items-center justify-center text-textMuted">...</span>
          
          <button 
            onClick={() => setPage(10)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition-colors
              ${page === 10 
                ? 'border-[#1a4731] bg-[#e8f1ec] text-[#1a4731]' 
                : 'border-transparent text-textMuted hover:bg-secondary'}`}
          >
            10
          </button>

          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-textMuted hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(Math.min(10, page + 1))}
            disabled={page === 10}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductsTable;
