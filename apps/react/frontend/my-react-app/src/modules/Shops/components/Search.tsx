import { useState } from 'react';

type FilterType = 'all' | 'promo' | 'popular';

export const SearchShops: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Логіка пошуку
    console.log('Пошук:', searchQuery, 'Фільтр:', activeFilter);
  };

  return (
    <div className="w-full max-w-[1130px] mx-auto bg-white rounded-[16px] border border-[#EFF2F1] shadow-[0_4px_24px_rgba(0,0,0,0.02)] px-5 py-[18px] font-sans">
      <form onSubmit={handleSearch} className="flex flex-col gap-[12px]">
        
        {/* Рядок пошуку: Інпут + Кнопка */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1">
            {/* Іконка лупи */}
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg
                className="w-[18px] h-[18px] text-[#70807E]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            
            <input
              type="text"
              placeholder="Пошук магазину..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[46px] bg-[#F4F6F6] border border-[#EAECEB] rounded-[12px] pl-11 pr-4 text-[15px] text-[#0D3E36] placeholder-[#70807E] focus:outline-none focus:border-[#234A41] focus:bg-white transition-all duration-200"
            />
          </div>
          
          <button
            type="submit"
            className="h-[46px] px-7 bg-[#234A41] hover:bg-[#1A3831] text-white font-medium text-[15px] rounded-[12px] transition-colors duration-200 whitespace-nowrap"
          >
            Знайти
          </button>
        </div>

        {/* Рядок табів (Фільтри) */}
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`h-[34px] px-5 rounded-full text-[14px] font-medium tracking-tight transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-[#234A41] text-white'
                : 'bg-transparent border border-[#EAECEB] text-[#70807E] hover:border-[#70807E] hover:text-[#0D3E36]'
            }`}
          >
            Усі магазини
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('promo')}
            className={`h-[34px] px-5 rounded-full text-[14px] font-medium tracking-tight transition-all duration-200 ${
              activeFilter === 'promo'
                ? 'bg-[#234A41] text-white'
                : 'bg-transparent border border-[#EAECEB] text-[#70807E] hover:border-[#70807E] hover:text-[#0D3E36]'
            }`}
          >
            Магазини з акціями
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('popular')}
            className={`h-[34px] px-5 rounded-full text-[14px] font-medium tracking-tight transition-all duration-200 ${
              activeFilter === 'popular'
                ? 'bg-[#234A41] text-white'
                : 'bg-transparent border border-[#EAECEB] text-[#70807E] hover:border-[#70807E] hover:text-[#0D3E36]'
            }`}
          >
            Популярні магазини
          </button>
        </div>

      </form>
    </div>
  );
};

export default SearchShops;