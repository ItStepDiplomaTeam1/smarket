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

const CATEGORY_LIGHT_ICONS = [home6, home7, home8, home9, home10, home11];
const CATEGORY_DARK_ICONS = [home6D, home7D, home8D, home9D, home10D, home11D];

import { useNavigate } from 'react-router-dom';

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
          {[
            { name: 'Продукти', slug: 'products' },
            { name: 'Напої', slug: 'drinks' },
            { name: 'Дитячі товари', slug: 'baby' },
            { name: 'Побутова хімія', slug: 'chemistry' },
            { name: 'Краса та догляд', slug: 'beauty' },
            { name: 'Товари для дому', slug: 'home' },
          ].map(({ name, slug }, idx) => (
            <div
              key={name}
              onClick={() => navigate(`/catalog?category=${slug}`)}
              className="bg-white dark:bg-[#15231D] border border-transparent dark:border-[#1F3227] rounded-[16px] px-[12px] py-[20px] sm:px-[16px] sm:py-[24px] flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1 cursor-pointer group"
            >
              <img 
                src={CATEGORY_LIGHT_ICONS[idx]} 
                alt={name} 
                className="w-[54px] h-[54px] sm:w-[64px] sm:h-[64px] mb-[16px] block dark:hidden" 
              />
              <div className="hidden dark:flex w-[54px] h-[54px] sm:w-[64px] sm:h-[64px] rounded-full bg-[#1A2E25] items-center justify-center mb-[16px]">
                <img 
                  src={CATEGORY_DARK_ICONS[idx]} 
                  alt={name} 
                  className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] object-contain opacity-90" 
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
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}