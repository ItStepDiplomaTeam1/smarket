import mockupCardLight from '@/shared/assets/mockup-card.svg';
import mockupCardDark from '@/shared/assets/mockup-card-dark.svg'; 
import checkIcon from '@/shared/assets/check.svg';

export function Hero() {
  return (
    <section className="w-full py-[40px] sm:py-[64px] lg:py-[96px] bg-[#FFFFFF] dark:bg-gradient-to-r dark:from-[#123322] dark:via-[#0D1C14] dark:to-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col lg:flex-row justify-between items-center gap-[32px] lg:gap-[40px]">

        {/* LEFT — text content */}
        <div className="flex-1 w-full max-w-[600px] flex flex-col gap-[16px] sm:gap-[24px]">
          
          {/* Eyebrow label */}
          <p className="self-start bg-[#EAF7F2] dark:bg-[#152721] rounded-[6px] px-[12px] pt-[3px] pb-[4px] text-[11px] sm:text-[12px] font-bold font-inter text-[#265447] dark:text-[#3CD27D] tracking-[0.1em] uppercase m-0 transition-colors">
            SMART SHOPPING / ЦІНИ / ЕКОНОМІЯ
          </p>

          {/* H1 */}
          <h1 className="font-manrope text-[36px] sm:text-[48px] lg:text-[68px] font-extrabold text-[#173B33] dark:text-white leading-tight lg:leading-[70.72px] m-0 transition-colors">
            Один кошик.<br />Найкраща ціна.
          </h1>

          {/* Subheading */}
          <p className="font-inter text-[16px] sm:text-[19px] font-normal text-[#6D8279] dark:text-[#A4B3AF] leading-relaxed m-0 transition-colors">
            Зберіть список покупок і Smarket покаже, у якому магазині вся корзина коштує дешевше.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row bg-white dark:bg-[#15231D] border border-[#E5E7EB] dark:border-[#1F3227] rounded-[16px] sm:rounded-[100px] p-2 sm:p-[8px_8px_8px_24px] gap-[12px] sm:gap-[8px] transition-colors">
            <div className="flex items-center flex-1 gap-2 pl-2 sm:pl-0">
              <span className="hidden dark:flex items-center text-[#7A8D85]">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              </span>
              <input
                type="text"
                placeholder="Введіть товар або список покупок"
                className="w-full border-none outline-none text-[14px] bg-transparent p-0 text-[#111827] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder-[#7A8D85] transition-colors"
              />
            </div>
            <button className="bg-[#FFD600] dark:bg-[#3CD27D] text-[#173B33] dark:text-[#0B120F] border-none h-[44px] sm:h-[48px] px-[24px] sm:pw-[32px] rounded-[12px] sm:rounded-[100px] font-inter font-semibold text-[14px] cursor-pointer flex items-center justify-center transition-colors duration-200 hover:bg-[#FACC15] dark:hover:bg-[#34B86D]">
              Порівняти ціни
            </button>
          </div>

          {/* Check badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-[12px] flex-wrap mt-[4px]">
            <div className="flex items-center gap-[8px] font-inter text-[13px] sm:text-[14px] font-medium text-[#265447] dark:text-[#A4B3AF] transition-colors">
              <img src={checkIcon} alt="" className="w-[18px] h-[18px] shrink-0 dark:hidden" />
              <svg className="w-[16px] h-[16px] shrink-0 hidden dark:block text-[#3CD27D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Економія на всій корзині</span>
            </div>
            <div className="flex items-center gap-[8px] font-inter text-[13px] sm:text-[14px] font-medium text-[#265447] dark:text-[#A4B3AF] transition-colors">
              <img src={checkIcon} alt="" className="w-[18px] h-[18px] shrink-0 dark:hidden" />
              <svg className="w-[16px] h-[16px] shrink-0 hidden dark:block text-[#3CD27D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Акції поруч</span>
            </div>
            <div className="flex items-center gap-[8px] font-inter text-[13px] sm:text-[14px] font-medium text-[#265447] dark:text-[#A4B3AF] transition-colors">
              <img src={checkIcon} alt="" className="w-[18px] h-[18px] shrink-0 dark:hidden" />
              <svg className="w-[16px] h-[16px] shrink-0 hidden dark:block text-[#3CD27D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Список для сім'ї</span>
            </div>
          </div>

          <p className="font-inter text-[13px] font-medium text-[#6D8279] dark:text-[#7A8D85] leading-normal m-0 transition-colors">
            Порівнюємо ціни, акції та магазини поруч з вами — без зайвих вкладок і довгого пошуку.
          </p>
        </div>

        {/* RIGHT — mockup */}
        <div className="flex-1 w-full flex justify-center lg:justify-end items-center mt-4 lg:mt-0">
          <img 
            src={mockupCardLight} 
            alt="Smarket кошик" 
            className="w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[460px] h-auto block dark:hidden" 
          />
          <img 
            src={mockupCardDark} 
            alt="Smarket кошик темний" 
            className="w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[460px] h-auto hidden dark:block drop-shadow-2xl" 
          />
        </div>

      </div>
    </section>
  );
}