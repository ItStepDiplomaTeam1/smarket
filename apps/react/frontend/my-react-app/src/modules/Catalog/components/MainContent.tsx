import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// ================= SVG ІКОНКИ ДЛЯ МАКЕТУ =================
const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DISCOUNT_OPTIONS = [
  { id: '10', name: 'до 10%', count: 120 },
  { id: '10-20', name: '10%-20%', count: 85 },
  { id: '20-30', name: '20%-30%', count: 43 },
  { id: '30+', name: '30%+', count: 14 },
];

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 2H2V6.66667H6.66667V2Z" fill="currentColor"/>
    <path d="M14 2H9.33333V6.66667H14V2Z" fill="currentColor"/>
    <path d="M6.66667 9.33333H2V14H6.66667V9.33333Z" fill="currentColor"/>
    <path d="M14 9.33333H9.33333V14H14V9.33333Z" fill="currentColor"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 4H5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 8H5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 12H5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 4H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.33333 1.66667L1.66667 8.33333M1.66667 1.66667L8.33333 8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ================= ТИПІЗАЦІЯ ДАНИХ З БЕКЕНДУ =================
interface StoreInfo {
  external_id: string;
  name: string;
  retail_chain: string;
  city: string;
  is_active: boolean;
  synced_at: string;
}

interface StoreOffer {
  store: StoreInfo;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  recorded_at: string;
}

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface Product {
  id: number;
  ean: string;
  store_product_id: string;
  title: string;
  brand: string | null;
  unit: string;
  weight: number;
  image_url: string | null;
  canonical_category_id: number;
  category: Category;
  created_at: string;
  offers?: StoreOffer[]; 
}

interface ProductsResponse {
  items: Product[];
  total: number;
  facets?: Record<string, Record<string, number>>;
}

interface FetchFilters {
  page: number;
  category: string;
  stores: string[];
  subcategories: string[];
  offers: string[];
  discounts: string[];
  maxPrice: number;
  search: string;
  sortBy: string;
}

// ================= КОНСТАНТИ ФІЛЬТРІВ (ОНОВЛЕНО ПІД БЕКЕНД) =================
export const MAIN_CATEGORIES = [
  { id: 1, slug: 'products', name: 'Продукти' },
  { id: 2, slug: 'drinks', name: 'Напої' },
  { id: 3, slug: 'snacks', name: 'Солодощі та снеки' },
  { id: 4, slug: 'alcohol-tobacco', name: 'Алкоголь та тютюн' },
  { id: 5, slug: 'home', name: 'Товари для дому' },
  { id: 6, slug: 'beauty', name: "Краса та догляд" },
  { id: 7, slug: 'zoo', name: 'Зоотовари' },
  { id: 8, slug: 'baby', name: 'Дитячі товари' },
  { id: 9, slug: 'chemistry', name: 'Побутова хімія' },
  { id: 10, slug: 'hobby-rest', name: 'Хобі та відпочинок' },
  { id: 11, slug: 'promo', name: 'Акції та промо' }
];

// Скарбничка слагов адаптована під search_filtering_guide.md
const CATEGORY_OPTIONS = [
  { id: 'products', icon: '🥦', name: 'Продукти', count: '1 240' },
  { id: 'drinks', icon: '🥤', name: 'Напої', count: '380' },
  { id: 'baby', icon: '🍼', name: 'Дитячі товари', count: '214' },
  { id: 'chemistry', icon: '🧼', name: 'Побутова хімія', count: '102' },
  { id: 'home', icon: '🪴', name: 'Товари для дому', count: '176' },
  { id: 'beauty', icon: '💄', name: 'Краса та догляд', count: '290' },
  { id: 'zoo', icon: '🐾', name: 'Зоотовари', count: '98' },
];

const STORE_OPTIONS = [
  { id: 'auchan', label: 'Ашан' },
  { id: 'novus', label: 'Novus' },
  { id: 'metro', label: 'Metro' },
  { id: 'zaraz', label: 'За Раз' },
  { id: 'chudomarket', label: 'Чудо Маркет' },
];

const SUBCATEGORY_OPTIONS = [
  { id: 'molochni-produkty', name: 'Молочна продукція', count: '218' },
  { id: 'myaso-ta-ptytsya', name: "М'ясо та птиця", count: '175' },
  { id: 'hlib-ta-vypichka', name: 'Хліб та випічка', count: '140' },
  { id: 'vegetables', name: 'Овочі та фрукти', count: '209' },
  { id: 'fish', name: 'Риба та морепродукти', count: '88' },
  { id: 'grains', name: 'Крупи та бобові', count: '124' },
  { id: 'frozen', name: 'Заморожені продукти', count: '96' },
  { id: 'cans', name: 'Консерви', count: '112' },
];

const PROPOSAL_OPTIONS = [
  { id: 'promo', name: 'Тільки акції', count: '340' },
  { id: 'new', name: 'Нові надходження', count: '58' },
  { id: 'save', name: 'Найбільша економія', count: '120' },
];

const fetchProducts = async (filters: FetchFilters): Promise<ProductsResponse> => {
    const limit = 12;
    const skip = (filters.page - 1) * limit;
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://smarket-api.duckdns.org'; // Backend base URL
    const url = new URL(`${apiBaseUrl}/api/v1/search/search`);
    
    // 1. Базові параметри пошуку та пагінації
    if (filters.search.trim()) {
        url.searchParams.append('q', filters.search.trim());
      }
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', skip.toString());
    
    // --- ФІЛЬТР КАТЕГОРІЇ (Тепер з правильними слагами) ---
    if (filters.category && filters.category !== 'products') {
        url.searchParams.append('category_slug', filters.category);
    }
    
    // 3. Максимальна ціна
    if (filters.maxPrice < 2000) {
        url.searchParams.append('price_max', filters.maxPrice.toString());
    }
    
    // 4. Магазини
    if (filters.stores.length > 0) {
        // Додаємо кожен магазин окремим параметром, як вказано в доці
        filters.stores.forEach(store => {
            url.searchParams.append('retail_chain', store);
        });
    }
    
    // 5. Підкатегорії (Динамічно розгортаються на бекенді)
    filters.subcategories.forEach(sub => {
        url.searchParams.append('subcategory_slug', sub);
    });
    
    // 6. Пропозиції
    filters.offers.forEach(offer => {
        url.searchParams.append('offer_type', offer);
    });
    
    // 7. Знижки
    filters.discounts.forEach(discount => {
        url.searchParams.append('discount_range', discount);
    });
    
    // 8. Сортування
    if (filters.sortBy === 'cheapest_first') {
        url.searchParams.append('sort', 'price:asc');
    } else if (filters.sortBy === 'expensive_first') {
        url.searchParams.append('sort', 'price:desc');
    }
    
    const res = await fetch(url.toString());
    const json = await res.json();
    if (!res.ok) {
        throw new Error('Помилка завантаження товарів');
    }
    const searchData = json;
    return {
        items: searchData.hits || [],
        total: searchData.total_hits || searchData.nb_hits || 0,
        facets: searchData.facets || {}
    };
};

export function MainContent() {
  const [page, setPage] = useState(1);
  
  // Клієнтські стейти
  const [maxPrice, setMaxPrice] = useState<number>(2000); 
  const [selectedCategory, setSelectedCategory] = useState<string>('products'); 
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]); 
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('best_price');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce ефект для пошуку
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Listen to filter updates from Zephyros AI Agent
  useEffect(() => {
    const handleApplyFilters = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.query !== undefined) {
        setSearchQuery(detail.query || '');
        setDebouncedSearch(detail.query || '');
      }
      if (detail.retail_chain !== undefined) {
        if (detail.retail_chain) {
          setSelectedStores([detail.retail_chain.toLowerCase()]);
        } else {
          setSelectedStores([]);
        }
      }
      if (detail.category_slug !== undefined) {
        setSelectedCategory(detail.category_slug || 'products');
      }
      if (detail.price_max !== undefined) {
        setMaxPrice(detail.price_max || 2000);
      }
      setPage(1);
    };
    window.addEventListener('smarket:apply-filters', handleApplyFilters);
    return () => window.removeEventListener('smarket:apply-filters', handleApplyFilters);
  }, []);

  const filterParams: FetchFilters = {
    page,
    category: selectedCategory,
    stores: selectedStores,
    subcategories: selectedSubcategories,
    offers: selectedOffers,
    discounts: selectedDiscounts,
    maxPrice,
    search: debouncedSearch,
    sortBy
  };

  const { data, isLoading } = useQuery<ProductsResponse>({
      queryKey: ['productsList', filterParams],
      queryFn: () => fetchProducts(filterParams),
  });

  const products = data?.items ?? [];
  const totalProducts = data?.total ?? 0;
  const facets = data?.facets || {};

  // Helpers to get dynamic counts from facets
  const getCategoryCount = (slug: string) => {
    if (slug === 'products') return totalProducts;
    if (!facets.main_category_id) return 0;
    const mainCat = MAIN_CATEGORIES.find(c => c.slug === slug);
    if (!mainCat) return 0;
    return facets.main_category_id[mainCat.id.toString()] || 0;
  };

  const getStoreCount = (id: string) => {
    if (!facets.retail_chain) return 0;
    return facets.retail_chain[id] || 0;
  };

  const getSubcategoryCount = (id: string) => {
    if (!facets.category_slug) return 0;
    let sum = 0;
    for (const [key, count] of Object.entries(facets.category_slug)) {
      if (key.startsWith(id)) sum += count;
    }
    return sum;
  };

  const getDiscountCount = (id: string) => {
    if (!facets.discount_percent) return 0;
    let sum = 0;
    for (const [key, count] of Object.entries(facets.discount_percent)) {
      const dp = parseInt(key, 10);
      if (isNaN(dp)) continue;
      if (id === '10' && dp <= 10) sum += count;
      else if (id === '10-20' && dp >= 10 && dp <= 20) sum += count;
      else if (id === '20-30' && dp >= 20 && dp <= 30) sum += count;
      else if (id === '30+' && dp >= 30) sum += count;
    }
    return sum;
  };

  // Хендлери перемикання фільтрів
  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // ПОВ'ЯЗАННЯ ЛОГІКИ: Очищаємо підкатегорії при зміні головної категорії,
    // щоб уникнути конфліктів у бекенд-пошуку
    setSelectedSubcategories([]);
    setPage(1);
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
    setPage(1);
  };

  const toggleSubcategory = (subId: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
    setPage(1);
  };

  const toggleDiscount = (id: string) => {
    setSelectedDiscounts(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setPage(1);
  };

  const toggleOffer = (offerId: string) => {
    setSelectedOffers(prev => 
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
    );
    setPage(1);
  };

  // Повне скидання фільтрів
  const resetFilters = () => {
    setSelectedCategory('products');
    setSelectedStores([]);
    setSelectedSubcategories([]);
    setSelectedOffers([]); 
    setSelectedDiscounts([]); 
    setMaxPrice(2000);

    setSearchQuery(''); 
    setSortBy('everything'); 
    setPage(1);
  };

  // Розрахунок кількості сторінок
  const totalPages = Math.ceil(totalProducts / 12);
  
  let paginationNumbers = [];
  if (totalPages <= 7) {
    paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (page <= 3) {
      paginationNumbers = [1, 2, 3, 4, '...', totalPages - 1, totalPages];
    } else if (page >= totalPages - 2) {
      paginationNumbers = [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      paginationNumbers = [1, '...', page - 1, page, page + 1, '...', totalPages];
    }
  }

  return (
    <div className="w-full max-w-[1228px] mx-auto px-[20px] py-[40px] flex gap-[40px] items-start mobile:flex-col">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[280px] bg-white rounded-[16px] border border-[#E5E7EB] p-[24px] flex flex-col font-inter shrink-0">
      
        {/* ================= КАТЕГОРІЇ ================= */}
        <div className="mb-[32px]">
          <h3 className="font-manrope text-[13px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Категорії
          </h3>
          <hr className="border-t border-[#F3F4F6] mb-[16px]" />
          
          <ul className="flex flex-col gap-[4px]">
            {CATEGORY_OPTIONS.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              const dynCount = getCategoryCount(cat.id);
              return (
                <li 
                  key={cat.id} 
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center justify-between p-[8px_12px] rounded-[8px] cursor-pointer transition-colors ${
                    isCatActive ? 'bg-[#EAF7F2]' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className={`flex items-center gap-[10px] text-[14px] ${
                    isCatActive ? 'font-semibold text-[#173B33]' : 'font-semibold text-[#4B6358]'
                  }`}>
                    <span className={`text-[16px] ${!isCatActive ? 'grayscale opacity-70' : ''}`}>
                      {cat.icon}
                    </span>
                    <span>{cat.name}</span>
                  </div>
                  <span className={`text-[12px] px-[8px] py-[2px] rounded-[100px] ${
                    isCatActive ? 'bg-[#D1E8DD] text-[#173B33] font-bold' : 'bg-[#F3F4F6] text-[#6D8279] font-semibold'
                  }`}>
                    {dynCount}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ================= ФІЛЬТРИ ================= */}
        <div>
          <h3 className="font-manrope text-[13px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Фільтри
          </h3>
          <hr className="border-t border-[#F3F4F6] mb-[20px]" />

          {/* 1. ЦІНА */}
          <div className="mb-[24px]">
            <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
                Ціна до (ГРН)
            </h4>
            <div className="border border-[#E5E7EB] rounded-[8px] px-[12px] py-[10px] mb-[16px]">
                <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setPage(1);
                }}
                className="w-full border-none outline-none text-[#111827] text-[14px] bg-transparent"
                />
            </div>
            
            <div className="relative flex items-center mx-[4px]">
                <input 
                type="range" 
                min="0" 
                max="2000" 
                value={maxPrice}
                onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setPage(1);
                }}
                className="w-full h-[4px] bg-[#F3F4F6] rounded-[2px] appearance-none cursor-pointer accent-[#173B33]"
                />
            </div>
          </div>

          {/* 2. МАГАЗИНИ */}
          <div className="mb-[24px]">
            <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
              Магазини
            </h4>
            <div className="flex flex-wrap gap-[8px]">
              {STORE_OPTIONS.map(store => {
                const isActive = selectedStores.includes(store.id);
                const dynCount = getStoreCount(store.id);
                return (
                  <button 
                    key={store.id}
                    onClick={() => toggleStore(store.id)}
                    className={`border px-[14px] py-[6px] rounded-[100px] text-[13px] font-medium cursor-pointer transition-colors ${
                      isActive 
                        ? 'border-[#173B33] bg-[#EAF7F2] text-[#173B33] font-semibold' 
                        : 'border-[#E5E7EB] bg-white text-[#6D8279] hover:border-[#D1D5DB]'
                    }`}
                  >
                    {store.label} <span className="opacity-70 text-[11px] ml-1">{dynCount}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ПІДКАТЕГОРІЯ */}
          <div className="mb-[24px]">
            <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
              Підкатегорія
            </h4>
            <div className="flex flex-col gap-[12px]">
              {SUBCATEGORY_OPTIONS.map((item) => {
                const isSubActive = selectedSubcategories.includes(item.id);
                const dynCount = getSubcategoryCount(item.id);
                return (
                  <label 
                    key={item.id} 
                    onClick={() => toggleSubcategory(item.id)}
                    className="flex items-center gap-[10px] cursor-pointer group"
                  >
                    <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                      isSubActive ? 'bg-[#173B33] border-none' : 'border border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]'
                    }`}>
                      {isSubActive && <CheckIcon />}
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-[#374151]">{item.name}</span>
                    <span className="text-[12px] text-[#9CA3AF]">{dynCount}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. РОЗМІР ЗНИЖКИ */}
          <div className="mb-[24px]">
            <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
              Розмір знижки
            </h4>
            <div className="flex flex-col gap-[12px]">
              {DISCOUNT_OPTIONS.map((item) => {
                const isDiscountActive = selectedDiscounts.includes(item.id);
                const dynCount = getDiscountCount(item.id);
                return (
                  <label 
                    key={item.id} 
                    onClick={() => {
                        setSelectedDiscounts(prev => 
                          prev.includes(item.id) 
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        );
                        setPage(1);
                    }}
                    className="flex items-center gap-[10px] cursor-pointer group"
                  >
                    <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                      isDiscountActive ? 'bg-[#173B33] border-none' : 'border border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]'
                    }`}>
                      {isDiscountActive && <CheckIcon />}
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-[#374151]">{item.name}</span>
                    <span className="text-[12px] text-[#9CA3AF]">{dynCount}</span>
                  </label>
                );
              })}
            </div>
          </div>


          <button 
            onClick={resetFilters}
            className="w-full border border-[#E5E7EB] bg-white rounded-[8px] py-[10px] font-inter text-[14px] font-semibold text-[#6D8279] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
          >
            Скинути фільтри
          </button>

        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Акційний баннер */}
        <div className="bg-[#265447] rounded-[12px] p-[20px_24px] flex justify-between items-center mb-[24px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="text-[14px] font-bold text-white tracking-[0.05em] uppercase m-0">
              Акційні ціни тижня
            </h2>
            <p className="text-[13px] text-[#A6C4B9] m-0">
              До п'ятниці: ексклюзивні знижки в АТБ та Сільпо
            </p>
          </div>
          <button className="bg-[#FFD600] text-[#111827] font-bold text-[14px] px-[16px] py-[8px] rounded-[100px] border-none cursor-pointer hover:bg-[#FACC15] transition-colors">
            До -30%
          </button>
        </div>

        {/* Панель сортування та пошуку */}
        <div className="flex justify-between items-center mb-[16px]">
          <div className="flex items-center gap-[10px] border border-[#E5E7EB] rounded-[8px] px-[12px] py-[10px] w-[320px] bg-white focus-within:border-[#265447] transition-colors">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Пошук товарів..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="flex-1 border-none outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent" 
            />
          </div>

          <div className="flex items-center gap-[16px]">
            <select 
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="border border-[#E5E7EB] rounded-[8px] px-[14px] py-[10px] text-[13px] font-medium text-[#374151] outline-none cursor-pointer bg-white appearance-none pr-[30px]" 
              style={{ 
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")', 
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' 
              }}
            >
              <option value="everything">Все</option>
              <option value="cheapest_first">Спочатку дешевші</option>
              <option value="expensive_first">Спочатку дорожчі</option>
            </select>

            <div className="flex items-center border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-[10px] border-none cursor-pointer flex items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'bg-[#F3F4F6] text-[#111827]' : 'bg-white text-[#9CA3AF] hover:bg-[#F9FAFB]'
                }`}
              >
                <GridIcon />
              </button>
              <div className="w-[1px] h-[20px] bg-[#E5E7EB]"></div>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-[10px] border-none cursor-pointer flex items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'bg-[#F3F4F6] text-[#111827]' : 'bg-white text-[#9CA3AF] hover:bg-[#F9FAFB]'
                }`}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* ================= АКТИВНІ ТЕГИ ================= */}
        <div className="flex items-center flex-wrap gap-[12px] mb-[24px]">
          <p className="text-[13px] text-[#6D8279] m-0">
              Знайдено <span className="font-bold text-[#111827]">{totalProducts} товарів</span>
          </p>
          
          <div className="flex gap-[8px] flex-wrap">
            {selectedCategory && selectedCategory !== 'products' && (
              <span 
                onClick={() => setSelectedCategory('products')}
                className="flex items-center gap-[6px] bg-[#EAF7F2] text-[#265447] px-[10px] py-[4px] rounded-[100px] text-[12px] font-medium cursor-pointer hover:bg-[#D1E8DD] transition-colors group"
              >
                Категорія: {CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.name}
                <span className="text-[#A6C4B9] group-hover:text-[#265447] transition-colors">
                  <CloseIcon />
                </span>
              </span>
            )}

            {selectedStores.map(storeId => {
              const storeLabel = STORE_OPTIONS.find(s => s.id === storeId)?.label;
              return (
                <span 
                  key={`tag-store-${storeId}`} 
                  onClick={() => toggleStore(storeId)}
                  className="flex items-center gap-[6px] bg-[#EAF7F2] text-[#265447] px-[10px] py-[4px] rounded-[100px] text-[12px] font-medium cursor-pointer hover:bg-[#D1E8DD] transition-colors group"
                >
                  {storeLabel}
                  <span className="text-[#A6C4B9] group-hover:text-[#265447] transition-colors">
                    <CloseIcon />
                  </span>
                </span>
              );
            })}

            {selectedSubcategories.map(subId => {
              const subLabel = SUBCATEGORY_OPTIONS.find(s => s.id === subId)?.name;
              return (
                <span 
                  key={`tag-sub-${subId}`} 
                  onClick={() => toggleSubcategory(subId)}
                  className="flex items-center gap-[6px] bg-[#EAF7F2] text-[#265447] px-[10px] py-[4px] rounded-[100px] text-[12px] font-medium cursor-pointer hover:bg-[#D1E8DD] transition-colors group"
                >
                  {subLabel}
                  <span className="text-[#A6C4B9] group-hover:text-[#265447] transition-colors">
                    <CloseIcon />
                  </span>
                </span>
              );
            })}

            {selectedOffers.map(offerId => {
              const offerLabel = PROPOSAL_OPTIONS.find(o => o.id === offerId)?.name;
              return (
                <span 
                  key={`tag-offer-${offerId}`} 
                  onClick={() => toggleOffer(offerId)}
                  className="flex items-center gap-[6px] bg-[#EAF7F2] text-[#265447] px-[10px] py-[4px] rounded-[100px] text-[12px] font-medium cursor-pointer hover:bg-[#D1E8DD] transition-colors group"
                >
                  {offerLabel}
                  <span className="text-[#A6C4B9] group-hover:text-[#265447] transition-colors">
                    <CloseIcon />
                  </span>
                </span>
              );
            })}

          </div>
        </div>

        {/* ================= СІТКА ПРОДУКТІВ ================= */}
        <div className={`grid gap-[16px] ${viewMode === 'grid' ? 'grid-cols-4' : 'grid-cols-1'}`}>
          {isLoading ? (
            <div className="col-span-full text-center py-10 font-medium text-[#6D8279]">
              Завантаження каталогу...
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-10 font-medium text-[#111827]">
              За вибраними фільтрами нічого не знайдено.
            </div>
          ) : (
            products.map((product) => {
              const offer = product.offers?.[0];
              const currentPrice = offer?.price || 0;
              const oldPrice = offer?.old_price || null;
              
              const discountPercent = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
              const discountAmount = oldPrice ? Math.round(oldPrice - currentPrice) : 0;
              
              const storesCount = product.offers?.length || 1; 

              return (
                <div key={product.id} className="border border-[#E5E7EB] rounded-[12px] p-[16px] flex flex-col bg-white hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start min-h-[24px]">
                    <div className="flex gap-[4px]">
                      {discountPercent > 0 && (
                        <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] bg-[#FFD600] text-[#111827]">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/product/${product.id}`} className="w-full h-[140px] bg-[#F9FAFB] rounded-[8px] flex items-center justify-center mb-[16px] overflow-hidden p-[8px]">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="w-[40px] h-[40px] bg-[#E5E7EB] rounded-[6px] opacity-40" />
                    )}
                  </Link>
                  
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.05em] mb-[4px] truncate">
                      {product.category?.name || 'Продукти'}
                    </span>
                    <h3 className="font-manrope text-[14px] font-bold text-[#111827] leading-[1.3] mb-[4px] line-clamp-2 min-h-[36px]">
                      {product.title}
                    </h3>
                    <span className="text-[12px] text-[#6D8279] mb-[12px]">
                      {product.brand || 'Без бренду'} · {product.weight} {product.unit === 'pcs' ? 'шт' : 'г'}
                    </span>
                    
                    <div className="flex items-center gap-[6px] mb-[16px]">
                      <div className="flex gap-[2px]">
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 1 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 2 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 3 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                      </div>
                      <span className="text-[12px] text-[#6D8279]">
                        {storesCount} {storesCount === 1 ? 'магазин' : storesCount < 5 ? 'магазини' : 'магазинів'}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex flex-col gap-[16px]">
                      <div className="flex justify-between items-end min-h-[36px]">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#6D8279] mb-[2px]">від</span>
                          <span className="font-manrope text-[20px] font-extrabold text-[#111827] leading-none">
                            {currentPrice} ₴
                          </span>
                        </div>
                        
                        {oldPrice && (
                          <div className="flex flex-col items-end gap-[4px]">
                            {discountAmount > 0 && (
                              <span className="text-[11px] text-[#9CA3AF] line-through leading-none">
                              {oldPrice} ₴
                              </span>
                            )}
                            {discountAmount > 0 && (
                              <span className="bg-[#EAF7F2] text-[#265447] text-[10px] font-bold px-[4px] py-[2px] rounded-[4px] leading-none">
                                -{discountAmount} ₴
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className={`w-full py-[8px] rounded-[6px] font-semibold text-[13px] border cursor-pointer transition-colors ${
                          oldPrice 
                            ? 'bg-[#265447] text-white border-[#265447] hover:bg-[#1A3E2F]' 
                            : 'bg-white text-[#265447] border-[#E5E7EB] hover:border-[#265447]'
                        }`}
                      >
                        Порівняти
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Блок пагінації */}
        {products.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-[20px] mt-[32px] w-full">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`flex items-center gap-[8px] px-[14px] py-[8px] border rounded-[8px] text-[14px] font-medium transition-colors ${
                page === 1 
                  ? 'border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed bg-white' 
                  : 'border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer bg-white'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Попередня
            </button>

            <div className="flex items-center gap-[4px] hidden sm:flex">
              {paginationNumbers.map((p, index) => (
                p === '...' ? (
                  <span key={`dots-${index}`} className="px-[12px] py-[8px] text-[14px] font-medium text-[#6B7280]">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[36px] h-[36px] flex items-center justify-center rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer ${
                      page === p
                        ? 'bg-[#265447] text-white border-none'
                        : 'bg-transparent text-[#6B7280] hover:bg-[#F3F4F6] border-none'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages} 
              className={`flex items-center gap-[8px] px-[14px] py-[8px] border rounded-[8px] text-[14px] font-medium transition-colors ${
                page >= totalPages 
                  ? 'border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed bg-white' 
                  : 'border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer bg-white'
              }`}
            >
              Наступна
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

      </main>
    </div>
  );
}