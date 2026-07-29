import { useNavigate } from 'react-router-dom';
import home6 from '@/shared/assets/home6.svg';
import home7 from '@/shared/assets/home7.svg';
import home8 from '@/shared/assets/home8.svg';
import home9 from '@/shared/assets/home9.svg';
import home10 from '@/shared/assets/home10.svg';
import home11 from '@/shared/assets/home11.svg';

import home6D from '@/shared/assets/home6D.svg';
import home7D from '@/shared/assets/home7D.svg';
import home8D from '@/shared/assets/home8D.svg';
import home9D from '@/shared/assets/home9D.svg';
import home10D from '@/shared/assets/home10D.svg';
import home11D from '@/shared/assets/home11D.svg';

const CATEGORIES = [
  { name: 'Продукти', slug: 'products', lightIcon: home6, darkIcon: home6D, fallback: '🥦' },
  { name: 'Напої', slug: 'drinks', lightIcon: home7, darkIcon: home7D, fallback: '🥤' },
  { name: 'Дитячі товари', slug: 'baby', lightIcon: home8, darkIcon: home8D, fallback: '🍼' },
  { name: 'Побутова хімія', slug: 'chemistry', lightIcon: home9, darkIcon: home9D, fallback: '🧼' },
  { name: 'Краса та догляд', slug: 'beauty', lightIcon: home10, darkIcon: home10D, fallback: '💄' },
  { name: 'Товари для дому', slug: 'home', lightIcon: home11, darkIcon: home11D, fallback: '🏠' },
] as const;

export function CategoriesSec() {
  const navigate = useNavigate();
  return (
    <section className="w-full py-[60px] sm:py-[80px] bg-[#F6FAF8] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[36px] sm:gap-[48px]">
        {/* Heading */}
        <div className="text-center flex flex-col items-center gap-[12px] sm:gap-[16px]">
          <h2 className="font-manrope text-[28px] sm:text-[40px] font-extrabold text-[#173B33] dark:text-white m-0 leading-tight transition-colors">
            Категорії покупок
          </h2>
          <p className="font-inter text-[15px] sm:text-[16px] text-[#6D8279] dark:text-[#A4B3AF] m-0 leading-[1.5] transition-colors">
            Знаходьте вигідні пропозиції за основними категоріями щоденних покупок.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[16px] sm:gap-[20px]">
          {CATEGORIES.map(({ name, slug, lightIcon, darkIcon, fallback }) => (
            <button
              type="button"
              key={name}
              onClick={() => navigate(`/catalog?category=${slug}`)}
              className="w-full bg-white dark:bg-[#15231D] border border-transparent dark:border-[#1F3227] rounded-[16px] px-[12px] py-[20px] sm:px-[16px] sm:py-[24px] flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1 cursor-pointer group"
            >
              <div className="relative w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] mb-[16px] rounded-[12px] bg-[#EAF7F2] dark:bg-[#1A2E25] flex items-center justify-center overflow-hidden">
                <span aria-hidden="true" className="text-[30px]">
                  {fallback}
                </span>
                <img
                  src={lightIcon}
                  alt=""
                  width="72"
                  height="72"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-contain block dark:hidden"
                />
                <img
                  src={darkIcon}
                  alt=""
                  width="72"
                  height="72"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-contain hidden dark:block"
                />
              </div>

              <h3 className="font-inter text-[14px] sm:text-[15px] font-bold text-[#173B33] dark:text-white m-0 mb-[8px] transition-colors">
                {name}
              </h3>

              <div
                className="font-inter text-[12px] sm:text-[13px] font-semibold text-[#265447] dark:text-[#3CD27D] no-underline transition-colors duration-200 hover:text-[#1A453A] dark:hover:text-white"
              >
                Переглянути <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
