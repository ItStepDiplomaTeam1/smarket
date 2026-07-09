import React from 'react';
import { useQuery } from '@tanstack/react-query';

const Badge: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-white dark:bg-[#15231D] px-[12px] md:px-[16px] py-[6px] md:py-[8px] rounded-[8px] border border-[#E5E7EB] dark:border-[#1F3227] flex items-center justify-center transition-colors">
    <span className="text-[#111827] dark:text-white font-bold text-[12px] md:text-[14px]">{text}</span>
  </div>
);

const API_BASE = import.meta.env.VITE_API_URL || 'https://smarket-api.duckdns.org';

export const HeadlineShops: React.FC = () => {
  const { data: stores } = useQuery<any[]>({
    queryKey: ['storesListRaw'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/stores/?is_active=true`);
      if (!res.ok) throw new Error('Помилка');
      return res.json();
    }
  });

  const uniqueChains = stores ? new Set(stores.map(s => s.retail_chain)).size : 0;

  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1230px] mx-auto px-[16px] md:px-[20px] pt-[24px] md:pt-[40px] pb-[16px] md:pb-[20px] font-sans">
        <nav className="font-inter text-[12px] md:text-[13px] text-[#6D8279] dark:text-[#7A8D85] mb-[12px] flex items-center gap-1.5 flex-wrap">
          <a href="/" className="hover:text-[#173B33] dark:hover:text-white transition-colors">Головна</a>
          <span className="text-[11px] text-[#B2C0B9] dark:text-[#4A5D54]">&gt;</span>
          <span className="text-[#173B33] dark:text-white font-medium">Магазини</span>
        </nav>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 min-h-auto md:min-h-[80px]">
          <div className="flex flex-col max-w-[700px] gap-[8px] md:gap-[12px]">
            <h1 className="font-manrope text-[28px] md:text-[36px] font-bold text-[#111827] dark:text-white leading-tight m-0">Магазини</h1>
            <p className="font-inter text-[14px] md:text-[15px] font-normal text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0">
              Порівнюйте ціни, акції та наявність товарів у популярних супермаркетах і торгових мережах.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[8px] md:gap-[12px] w-full md:w-auto mt-2 md:mt-0">
            {uniqueChains > 0 && (
              <>
                <Badge text={`${uniqueChains} мереж`} />
                <Badge text={`${stores?.length || 0} магазинів`} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HeadlineShops;