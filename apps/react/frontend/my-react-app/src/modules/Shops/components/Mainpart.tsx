import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useLocationStore } from '@/shared/store/locationStore';
import { getCityDisplayName, getOptionalCityFilter } from '@/shared/utils/city';

// ================= ІКОНКИ =================
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ================= ТИПИ =================
interface StoreFromAPI {
  external_id: string;
  name: string;
  retail_chain: string;
  city: string | null;
  is_active: boolean;
  synced_at: string;
}

interface StoreStats {
  total_products: number;
  promo_products: number;
  max_savings: number;
  store_name: string;
  store_description: string;
  store_logo_url: string;
}

interface StoreCard {
  id: string;
  name: string;
  retail_chain: string;
  desc: string;
  prod: number;
  promo: number;
  eco: number;
  city: string;
}

const STORE_BADGES: Record<string, { label: string; className: string }> = {
  novus: {
    label: 'NOVUS',
    className: 'bg-[#187A4A] text-white',
  },
  atb: {
    label: 'АТБ',
    className: 'bg-[#D71920] text-white',
  },
  silpo: {
    label: 'СІЛЬПО',
    className: 'bg-[#F58220] text-white',
  },
  auchan: {
    label: 'AUCHAN',
    className: 'bg-white text-[#D71920]',
  },
  metro: {
    label: 'METRO',
    className: 'bg-[#003B7A] text-[#FFD500]',
  },
  ekomarket: {
    label: 'EKO',
    className: 'bg-[#1F8A43] text-white',
  },
};

// ================= API =================
const API_BASE = import.meta.env.VITE_API_URL || 'https://smarket-api.duckdns.org';

const fetchStores = async (city?: string): Promise<StoreFromAPI[]> => {
  const url = `${API_BASE}/api/v1/stores/?is_active=true${city ? `&city=${encodeURIComponent(city)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Помилка завантаження магазинів');
  return res.json();
};

const fetchStoreStats = async (storeId: string): Promise<StoreStats> => {
  const res = await fetch(`${API_BASE}/api/v1/stores/${storeId}/stats`);
  if (!res.ok) throw new Error(`Помилка завантаження статистики для ${storeId}`);
  return res.json();
};

const fetchStoresWithStats = async (city?: string): Promise<StoreCard[]> => {
  const stores = await fetchStores(city);
  
  const chainMap = new Map<string, StoreFromAPI>();
  for (const store of stores) {
    if (!chainMap.has(store.retail_chain)) {
      chainMap.set(store.retail_chain, store);
    }
  }
  
  const representatives = Array.from(chainMap.values());
  
  const results = await Promise.allSettled(
    representatives.map(async (store): Promise<StoreCard> => {
      try {
        const stats = await fetchStoreStats(store.external_id);
        return {
          id: store.external_id,
          name: stats.store_name,
          retail_chain: store.retail_chain,
          desc: stats.store_description,
          prod: stats.total_products,
          promo: stats.promo_products,
          eco: stats.max_savings,
          city: getCityDisplayName(store.city || city || ''),
        };
      } catch {
        return {
          id: store.external_id,
          name: store.name,
          retail_chain: store.retail_chain,
          desc: `Магазин мережі ${store.retail_chain}`,
          prod: 0,
          promo: 0,
          eco: 0,
          city: getCityDisplayName(store.city || city || ''),
        };
      }
    })
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<StoreCard> => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => b.prod - a.prod);
};

// ================= СКЕЛЕТОН КАРТКИ =================
const StoreCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#15231D] border border-[#E5E7EB] dark:border-transparent rounded-[16px] p-[20px] flex flex-col animate-pulse">
    <div className="flex justify-between items-start mb-[16px]">
      <div className="w-[52px] h-[52px] rounded-[12px] bg-[#F3F4F6] dark:bg-[#1A2E25]" />
    </div>
    <div className="h-[20px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded mb-[8px] w-[60%]" />
    <div className="h-[14px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded mb-[20px] w-[90%]" />
    <div className="flex flex-col mb-[24px] gap-[8px]">
      <div className="h-[14px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded w-full" />
      <div className="h-[14px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded w-full" />
      <div className="h-[14px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded w-full" />
    </div>
    <div className="h-[38px] bg-[#F3F4F6] dark:bg-[#1A2E25] rounded-[8px] mt-auto" />
  </div>
);

// ================= КОМПОНЕНТ =================
export const Mainpart: React.FC = () => {
  const currentCity = useLocationStore((state) => state.currentCity);
  const isCityFilterEnabled = useLocationStore((state) => state.isCityFilterEnabled);
  const cityFilter = getOptionalCityFilter(currentCity, isCityFilterEnabled);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: stores, isLoading } = useQuery<StoreCard[]>({
    queryKey: ['storesList', cityFilter],
    queryFn: () => fetchStoresWithStats(cityFilter),
    staleTime: 5 * 60 * 1000, 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategoryTab(category);
    setCurrentPage(1);
  };

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    
    let result = [...stores];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.retail_chain.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q)
      );
    }
    
    switch (activeCategoryTab) {
      case 'promo': result.sort((a, b) => b.promo - a.promo); break;
      case 'products': result.sort((a, b) => b.prod - a.prod); break;
      case 'economy': result.sort((a, b) => b.eco - a.eco); break;
      case 'popular':
      default: result.sort((a, b) => b.prod - a.prod); break;
    }
    
    return result;
  }, [stores, searchQuery, activeCategoryTab]);

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const paginatedStores = filteredStores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPromos = stores?.reduce((sum, s) => sum + s.promo, 0) || 0;
  const maxEconomy = stores?.reduce((max, s) => Math.max(max, s.eco), 0) || 0;

  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300 pb-10">
      <div className="w-full max-w-[1230px] mx-auto px-[16px] md:px-[20px] font-sans">
        
        {/* ================= БЛОК ПОШУКУ ================= */}
        <div className="w-full bg-white dark:bg-[#15231D] rounded-[16px] border border-[#E5E7EB] dark:border-[#1F3227] p-[16px] md:p-[20px] mb-[32px] md:mb-[40px] transition-colors">
          <form onSubmit={handleSearch} className="flex flex-col gap-[16px]">
            
            {/* Інпут та кнопка */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[12px] w-full">
              <div className="relative flex-1 w-full">
                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#7A8D85] transition-colors">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Пошук магазину..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full h-[46px] md:h-[48px] bg-[#F9FAFB] dark:bg-[#0D1612] border border-[#E5E7EB] dark:border-[#1F3227] rounded-[8px] pl-[44px] pr-[16px] text-[14px] text-[#111827] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#7A8D85] outline-none focus:border-[#265447] dark:focus:border-[#3CD27D] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto h-[46px] md:h-[48px] px-[32px] bg-[#265447] dark:bg-[#3CD27D] hover:bg-[#1A3E2F] dark:hover:bg-[#34B86D] text-white dark:text-[#0B120F] font-semibold text-[14px] rounded-[8px] transition-colors"
              >
                Знайти
              </button>
            </div>

            {/* Статистичні бейджі */}
            {stores && stores.length > 0 && (
              <div className="flex flex-wrap items-center gap-[8px] md:gap-[10px]">
                <span className="px-[10px] md:px-[12px] py-[4px] md:py-[5px] rounded-[100px] bg-[#EAF7F2] dark:bg-[#1A3026] text-[#265447] dark:text-[#3CD27D] text-[11px] md:text-[12px] font-semibold">
                  {stores.length} мереж
                </span>
                <span className="px-[10px] md:px-[12px] py-[4px] md:py-[5px] rounded-[100px] bg-[#FEF3C7] dark:bg-[#332B00] text-[#92400E] dark:text-[#FFB020] text-[11px] md:text-[12px] font-semibold">
                  {totalPromos}+ акцій
                </span>
                <span className="px-[10px] md:px-[12px] py-[4px] md:py-[5px] rounded-[100px] bg-[#F3E8FF] dark:bg-[#2D1B52] text-[#7C3AED] dark:text-[#A78BFA] text-[11px] md:text-[12px] font-semibold">
                  до {maxEconomy}% економії
                </span>
              </div>
            )}
          </form>
        </div>

        {/* ================= ЗАГОЛОВОК СІТКИ ТА ТАБИ ================= */}
        <div className="mb-[16px] md:mb-[24px]">
          <h2 className="font-manrope text-[20px] md:text-[24px] font-bold text-[#111827] dark:text-white mb-[8px] transition-colors">
            Усі магазини
          </h2>
          <p className="font-inter text-[13px] md:text-[14px] text-[#6D8279] dark:text-[#A4B3AF] transition-colors">
            Обирайте магазин, переглядайте актуальні акції та додавайте товари у кошик для порівняння.
          </p>
        </div>

        {/* Таби категорій */}
        <div className="flex flex-wrap items-center gap-[8px] md:gap-[10px] mb-[24px] md:mb-[32px]">
          {[
            { id: 'popular', label: 'Популярні' },
            { id: 'promo', label: 'Більше акцій' },
            { id: 'products', label: 'Більше товарів' },
            { id: 'economy', label: 'Найбільша економія' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-[14px] md:px-[16px] py-[6px] md:py-[8px] rounded-[100px] text-[12px] md:text-[13px] font-medium transition-colors ${
                activeCategoryTab === tab.id
                  ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F]'
                  : 'bg-[#F3F4F6] dark:bg-[#1A2E25] text-[#6D8279] dark:text-[#7A8D85] hover:bg-[#E5E7EB] dark:hover:bg-[#233F32]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= СІТКА КАРТОК ================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px] md:gap-[20px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="w-full text-center py-16">
            <p className="text-[14px] md:text-[16px] text-[#6D8279] dark:text-[#7A8D85]">
              {searchQuery ? 'Магазинів за вашим запитом не знайдено' : 'Магазини не знайдено'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px] md:gap-[20px]">
            {paginatedStores.map((store) => (
              <div 
                key={store.id} 
                className="bg-white dark:bg-[#15231D] border border-[#E5E7EB] dark:border-transparent rounded-[16px] p-[16px] md:p-[20px] flex flex-col hover:shadow-sm dark:hover:shadow-none transition-all group"
              >
                {/* Логотип та Бейдж */}
                <div className="flex justify-between items-start mb-[16px]">
                  <div
                    aria-label={`Логотип ${store.name}`}
                    className={`w-[48px] h-[48px] md:w-[52px] md:h-[52px] rounded-[12px] border border-[#E5E7EB] dark:border-[#2B4236] flex items-center justify-center p-[6px] overflow-hidden shrink-0 ${
                      STORE_BADGES[store.retail_chain]?.className ??
                      'bg-white text-[#111827]'
                    }`}
                  >
                    <span className="font-black text-[10px] md:text-[11px] text-center leading-tight tracking-[-0.02em]">
                      {STORE_BADGES[store.retail_chain]?.label ??
                        store.retail_chain.slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                  
                  {store.promo > 0 && (
                    <span className="px-[8px] py-[4px] rounded-[6px] text-[10px] font-bold uppercase tracking-wider bg-[#FFC72C] text-[#111827]">
                      {store.promo} акцій
                    </span>
                  )}
                </div>

                {/* Текст */}
                <h3 className="font-manrope text-[16px] md:text-[18px] font-bold text-[#111827] dark:text-white mb-[4px] leading-tight transition-colors">
                  {store.name}
                </h3>
                <p className="text-[12px] md:text-[13px] text-[#6D8279] dark:text-[#7A8D85] mb-[16px] md:mb-[20px] line-clamp-2 leading-[1.4] h-[34px] md:h-[36px] transition-colors">
                  {store.desc}
                </p>

                {/* Статистика */}
                <div className="flex flex-col mb-[20px] md:mb-[24px]">
                  <div className="flex justify-between items-center py-[6px] md:py-[8px] border-b border-[#F3F4F6] dark:border-[#1F3227] transition-colors">
                    <span className="text-[12px] md:text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Товарів</span>
                    <span className="text-[12px] md:text-[13px] font-bold text-[#111827] dark:text-white">{store.prod.toLocaleString('uk-UA')}</span>
                  </div>
                  <div className="flex justify-between items-center py-[6px] md:py-[8px] border-b border-[#F3F4F6] dark:border-[#1F3227] transition-colors">
                    <span className="text-[12px] md:text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Акцій</span>
                    <span className="text-[12px] md:text-[13px] font-bold text-[#111827] dark:text-white">{store.promo}</span>
                  </div>
                  <div className="flex justify-between items-center py-[6px] md:py-[8px]">
                    <span className="text-[12px] md:text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Економія</span>
                    <span className="text-[12px] md:text-[13px] font-bold text-[#F59E0B] dark:text-[#FFB020]">до {store.eco}%</span>
                  </div>
                </div>

                {/* Кнопка */}
                <Link 
                  to={`/catalog?store=${store.retail_chain}`}
                  className="w-full mt-auto bg-[#EAF7F2] dark:bg-[#1A3026] text-[#265447] dark:text-[#3CD27D] font-semibold text-[13px] py-[10px] rounded-[8px] hover:bg-[#D1E8DD] dark:hover:bg-[#233F32] transition-colors text-center no-underline"
                >
                  Переглянути товари
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ================= ПАГІНАЦІЯ ================= */}
        {!isLoading && filteredStores.length > itemsPerPage && (
          <div className="flex justify-center items-center flex-wrap gap-[8px] mt-[32px] md:mt-[40px]">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-[8px] border border-[#E5E7EB] dark:border-[#1F3227] flex items-center justify-center text-[#6D8279] dark:text-[#7A8D85] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F4F6] dark:hover:bg-[#1A2E25] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-[8px] font-semibold text-[13px] md:text-[14px] transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F]' 
                        : 'border border-[#E5E7EB] dark:border-[#1F3227] text-[#6D8279] dark:text-[#7A8D85] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2E25]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === currentPage - 2 || 
                pageNum === currentPage + 2
              ) {
                return <span key={pageNum} className="text-[#6D8279] dark:text-[#7A8D85]">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-[8px] border border-[#E5E7EB] dark:border-[#1F3227] flex items-center justify-center text-[#6D8279] dark:text-[#7A8D85] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F4F6] dark:hover:bg-[#1A2E25] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Mainpart;
