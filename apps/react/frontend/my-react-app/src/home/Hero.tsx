import mockupCard from '../assets/mockup-card.svg';
import checkIcon from '../assets/check.svg';

export function Hero() {
  return (
    /* Screenshot: solid light greenish-white background, NOT a gradient */
    <section className="w-full bg-[#F6FAF8] pt-[72px] pb-[80px]">
      <div className="w-full max-w-[1228px] mx-auto px-6 flex justify-between items-center gap-16">

        {/* LEFT — text content */}
        <div className="flex-1 max-w-[580px] flex flex-col">
          {/* Eyebrow label */}
          <p className="self-start bg-[#EAF7F2] rounded-[6px] px-3 py-[3px] text-[11px] font-bold font-inter text-[#265447] tracking-[0.08em] uppercase mb-5">
            SMART SHOPPING / ЦІНИ / ЕКОНОМІЯ
          </p>

          {/* H1 — screenshot shows ~56-60px bold dark green heading */}
          <h1 className="font-manrope text-[56px] font-extrabold text-[#173B33] leading-[1.1] m-0 mb-5">
            Один кошик.<br />Найкраща ціна.
          </h1>

          {/* Subheading */}
          <p className="font-inter text-[17px] font-normal text-[#6D8279] leading-[1.7] m-0 mb-7">
            Зберіть список покупок і Smarket покаже, у якому магазині вся корзина коштує дешевше.
          </p>

          {/* Search bar */}
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-full py-[6px] pl-5 pr-[6px] gap-2 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <input
              type="text"
              placeholder="Введіть товар або список покупок"
              className="flex-1 border-none outline-none text-sm bg-transparent p-0 text-[#111827] placeholder:text-[#9CA3AF]"
            />
            <button className="bg-[#265447] text-white border-none h-10 px-6 rounded-full font-inter font-semibold text-sm cursor-pointer flex items-center justify-center whitespace-nowrap transition-colors duration-200 hover:bg-[#1A3E2F]">
              Порівняти ціни
            </button>
          </div>

          {/* Check badges */}
          <div className="flex items-center gap-5 flex-wrap mb-5">
            <div className="flex items-center gap-2 font-inter text-[13px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-4 h-4 shrink-0" />
              <span>Економія на всій корзині</span>
            </div>
            <div className="flex items-center gap-2 font-inter text-[13px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-4 h-4 shrink-0" />
              <span>Акції поруч</span>
            </div>
            <div className="flex items-center gap-2 font-inter text-[13px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-4 h-4 shrink-0" />
              <span>Список для сім'ї</span>
            </div>
          </div>

          <p className="font-inter text-[13px] font-normal text-[#9CA3AF] leading-[1.6] m-0">
            Порівнюємо ціни, акції та магазини поруч з вами — без зайвих вкладок і довгого пошуку.
          </p>
        </div>

        {/* RIGHT — mockup */}
        <div className="flex-1 flex justify-end items-center">
          <img src={mockupCard} alt="Smarket кошик" className="w-full max-w-[480px] h-auto block" />
        </div>

      </div>
    </section>
  );
}