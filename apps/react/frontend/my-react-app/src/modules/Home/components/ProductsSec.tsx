import product1 from '@/shared/assets/div.product-visual.svg';

// Іконки для темної теми як на макеті
const DARK_ICONS = [
  <svg key="1" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2z"/><path d="M3 15h6"/><path d="M3 18h6"/><path d="M3 21h6"/></svg>,
  <svg key="2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  <svg key="3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  <svg key="4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  <svg key="5" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3CD27D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
];

export function ProductsSec() {
  return (
    <section className="w-full py-[96px] bg-white dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[48px]">

        {/* Heading block */}
        <div className="max-w-[600px] mx-auto flex flex-col items-center text-center gap-[16px]">
          <h2 className="font-manrope text-[40px] font-extrabold text-[#173B33] dark:text-white m-0 leading-[1.2] transition-colors">
            Популярні товари для порівняння
          </h2>
          <p className="font-inter text-[16px] text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0 transition-colors">
            Швидко перевіряйте ціни на товари, які найчастіше додають у <br className="hidden sm:block" /> кошик.
          </p>
        </div>

        {/* 5-column product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-[20px]">
          {[
            { name: 'Молоко 2,5%',       info: 'від 38 грн · 4 магазини',     discount: 'Економія до 17 грн' },
            { name: 'Кава мелена',       info: 'від 129 грн · 3 магазини',    discount: 'Економія до 42 грн' },
            { name: 'Підгузки',          info: 'від 349 грн · 3 магазини',    discount: 'Економія до 86 грн' },
            { name: 'Соняшникова олія',  info: 'від 62 грн · 6 магазинів',    discount: 'Економія до 21 грн' },
            { name: 'Пральний порошок',  info: 'від 219 грн · 4 магазини',    discount: 'Економія до 62 грн' },
          ].map(({ name, info, discount }, index) => (
            <div
              key={name}
              className="bg-white dark:bg-[#15231D] border border-[#F3F4F6] dark:border-transparent rounded-[16px] px-[20px] py-[24px] flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1"
            >
              {/* Product icon for Light Theme */}
              <img 
                src={product1} 
                alt={name} 
                className="w-full max-w-[80px] h-auto mb-[24px] block dark:hidden" 
              />
              {/* Product icon for Dark Theme (as in the screenshot) */}
              <div className="hidden dark:flex w-[100px] h-[100px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1A3B2A] to-[#111C17] rounded-[16px] border border-[#1A3125] items-center justify-center mb-[24px]">
                {DARK_ICONS[index]}
              </div>

              <h3 className="font-inter text-[15px] font-bold text-[#173B33] dark:text-white m-0 mb-[8px] leading-[1.4] transition-colors">
                {name}
              </h3>
              
              <p className="font-inter text-[13px] text-[#6D8279] dark:text-[#7A8D85] m-0 mb-[4px] transition-colors">
                {info}
              </p>
              
              <p className="font-inter text-[13px] font-semibold text-[#E29A00] dark:text-[#FFC72C] m-0 mb-[24px] transition-colors">
                {discount}
              </p>

              <button className="w-full p-[10px] rounded-[100px] border border-[#E5E7EB] dark:border-[#2B4236] bg-transparent font-inter text-[14px] font-semibold text-[#265447] dark:text-[#3CD27D] cursor-pointer mt-auto transition-all duration-200 hover:border-[#265447] dark:hover:border-transparent hover:text-[#265447] dark:hover:text-[#0B120F] hover:bg-[#F6FAF8] dark:hover:bg-[#3CD27D]">
                Порівняти
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}