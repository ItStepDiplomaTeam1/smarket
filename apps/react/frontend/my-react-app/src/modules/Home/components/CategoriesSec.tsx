import product1 from '@/shared/assets/div.product-visual.svg';

const CATEGORY_ICONS = [
  <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
  <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"/><path d="M10 16.5v-3"/><path d="M14 16.5v-3"/><path d="M7 22v-5.5A2.5 2.5 0 0 1 9.5 14h5a2.5 2.5 0 0 1 2.5 2.5V22"/><path d="M15 14V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v8"/><path d="M14 2v4"/><path d="M10 2v4"/></svg>,
  <svg key="3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  <svg key="4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 4.2c3.11 3.11 3.11 8.2 0 11.31-3.12 3.12-8.2 3.12-11.32 0-3.11-3.11-3.11-8.2 0-11.31L12 2.69z"/></svg>,
  <svg key="5" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  <svg key="6" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
];

export function CategoriesSec() {
  return (
    <section className="w-full py-[80px] bg-[#F6FAF8] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[48px]">

        {/* Heading */}
        <div className="text-center flex flex-col items-center gap-[16px]">
          <h2 className="font-manrope text-[40px] font-extrabold text-[#173B33] dark:text-white m-0 leading-[1.2] transition-colors">
            Категорії покупок
          </h2>
          <p className="font-inter text-[16px] text-[#6D8279] dark:text-[#A4B3AF] m-0 leading-[1.5] transition-colors">
            Знаходьте вигідні пропозиції за основними категоріями <br className="hidden sm:block" /> щоденних покупок.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[20px]">
          {[
            'Продукти',
            'Напої',
            'Дитячі товари',
            'Побутова хімія',
            'Краса та догляд',
            'Товари для дому',
          ].map((name, idx) => (
            <div
              key={name}
              className="bg-white dark:bg-[#15231D] border border-transparent dark:border-[#1F3227] rounded-[16px] px-[16px] py-[24px] flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1 cursor-pointer group"
            >
              {/* Photo Light Mode */}
              <img 
                src={product1} 
                alt={name} 
                className="w-[64px] h-[64px] mb-[16px] block dark:hidden" 
              />
              {/* Photo Dark Mode */}
              <div className="hidden dark:flex w-[64px] h-[64px] rounded-full bg-[#1A2E25] items-center justify-center mb-[16px]">
                {CATEGORY_ICONS[idx]}
              </div>

              <h3 className="font-inter text-[15px] font-bold text-[#173B33] dark:text-white m-0 mb-[8px] transition-colors">
                {name}
              </h3>

              <a
                href="#"
                className="font-inter text-[13px] font-semibold text-[#265447] dark:text-[#3CD27D] no-underline transition-colors duration-200 hover:text-[#1A453A] dark:hover:text-white"
              >
                Переглянути акції <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}