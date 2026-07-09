import React from 'react';

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <div className="bg-white dark:bg-[#15231D] px-[16px] py-[8px] rounded-[8px] border border-[#E5E7EB] dark:border-[#1F3227] flex items-center justify-center transition-colors">
      <span className="text-[#111827] dark:text-white font-bold text-[14px]">
        {text}
      </span>
    </div>
  );
};

export const HeadlineShops: React.FC = () => {
  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1230px] mx-auto px-[20px] pt-[40px] pb-[20px] font-sans">
        
        {/* Хлібні крихти */}
        <nav className="font-inter text-[13px] text-[#6D8279] dark:text-[#7A8D85] mb-[12px] flex items-center gap-1.5 transition-colors">
          <a href="/" className="hover:text-[#173B33] dark:hover:text-white transition-colors">Головна</a>
          <span className="text-[11px] text-[#B2C0B9] dark:text-[#4A5D54]">&gt;</span>
          <span className="text-[#173B33] dark:text-white font-medium transition-colors">Магазини</span>
        </nav>

        {/* Основний контейнер */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 min-h-[80px]">
          
          {/* Ліва частина: Заголовок та Опис */}
          <div className="flex flex-col max-w-[700px] gap-[12px]">
            <h1 className="font-manrope text-[36px] font-bold text-[#111827] dark:text-white leading-tight m-0 transition-colors">
              Магазини
            </h1>
            <p className="font-inter text-[15px] font-normal text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0 transition-colors">
              Порівнюйте ціни, акції та наявність товарів у популярних супермаркетах і торгових мережах.
            </p>
          </div>

          {/* Права частина: Група бейджів */}
          <div className="flex flex-wrap items-center gap-[12px]">
            <Badge text="340 акцій" />
            <Badge text="12 магазинів" />
            <Badge text="до 30% економії" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeadlineShops;