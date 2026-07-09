import { useState } from 'react';
type FilterType = 'all' | 'promo' | 'popular';

export const SearchShops: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <div className="w-full max-w-[1130px] mx-auto bg-white rounded-[16px] border border-[#EFF2F1] shadow-[0_4px_24px_rgba(0,0,0,0.02)] px-4 sm:px-5 py-[16px] sm:py-[18px] font-sans">
      <form onSubmit={handleSearch} className="flex flex-col gap-[12px]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative w-full flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-[18px] h-[18px] text-[#70807E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input type="text" placeholder="Пошук магазину..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-[46px] bg-[#F4F6F6] border border-[#EAECEB] rounded-[12px] pl-11 pr-4 text-[14px] sm:text-[15px] text-[#0D3E36] placeholder-[#70807E] focus:outline-none focus:border-[#234A41] focus:bg-white transition-all duration-200" />
          </div>
          <button type="submit" className="w-full sm:w-auto h-[46px] px-7 bg-[#234A41] hover:bg-[#1A3831] text-white font-medium text-[15px] rounded-[12px] transition-colors duration-200">Знайти</button>
        </div>

        <div className="flex flex-wrap items-center gap-[8px] sm:gap-[10px]">
          {['all', 'promo', 'popular'].map((f) => (
            <button key={f} type="button" onClick={() => setActiveFilter(f as FilterType)} className={`h-[34px] px-4 sm:px-5 rounded-full text-[13px] sm:text-[14px] font-medium tracking-tight transition-all duration-200 ${activeFilter === f ? 'bg-[#234A41] text-white' : 'bg-transparent border border-[#EAECEB] text-[#70807E] hover:border-[#70807E] hover:text-[#0D3E36]'}`}>
              {f === 'all' ? 'Усі магазини' : f === 'promo' ? 'Магазини з акціями' : 'Популярні магазини'}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
export default SearchShops;