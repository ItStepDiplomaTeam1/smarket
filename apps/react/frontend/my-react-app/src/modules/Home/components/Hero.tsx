import mockupCard from '@/shared/assets/mockup-card.svg';
import checkIcon from '@/shared/assets/check.svg';

export function Hero() {
  return (
    <section className="w-full py-[96px] bg-gradient-to-b from-[#F6FAF8] to-[#EAF7F2]">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex justify-between items-center gap-[40px]">

        {/* LEFT — text content */}
        <div className="flex-1 max-w-[600px] flex flex-col gap-[24px]">
          
          {/* Eyebrow label */}
          <p className="self-start bg-[#EAF7F2] rounded-[6px] px-[12px] pt-[3px] pb-[4px] text-[12px] font-bold font-inter text-[#265447] tracking-[0.1em] uppercase m-0">
            SMART SHOPPING / ЦІНИ / ЕКОНОМІЯ
          </p>

          {/* H1 */}
          <h1 className="font-manrope text-[68px] font-extrabold text-[#173B33] leading-[70.72px] m-0">
            Один кошик.<br />Найкраща ціна.
          </h1>

          {/* Subheading */}
          <p className="font-inter text-[19px] font-normal text-[#6D8279] leading-[32.3px] m-0">
            Зберіть список покупок і Smarket покаже, у якому магазині вся корзина коштує дешевше.
          </p>

          {/* Search bar */}
          <div className="flex bg-white border border-[#E5E7EB] rounded-[100px] p-[8px_8px_8px_24px] gap-[8px]">
            <input
              type="text"
              placeholder="Введіть товар або список покупок"
              className="flex-1 border-none outline-none text-[14px] bg-transparent p-0 text-[#111827] placeholder:text-[#9CA3AF]"
            />
            <button className="bg-[#265447] text-white border-none h-[48px] px-[32px] rounded-[100px] font-inter font-semibold text-[14px] cursor-pointer flex items-center justify-center transition-colors duration-200 hover:bg-[#1A3E2F]">
              Порівняти ціни
            </button>
          </div>

          {/* Check badges */}
          <div className="flex items-center gap-[12px] flex-wrap">
            <div className="flex items-center gap-[8px] font-inter text-[14px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-[20px] h-[20px] shrink-0" />
              <span>Економія на всій корзині</span>
            </div>
            <div className="flex items-center gap-[8px] font-inter text-[14px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-[20px] h-[20px] shrink-0" />
              <span>Акції поруч</span>
            </div>
            <div className="flex items-center gap-[8px] font-inter text-[14px] font-medium text-[#265447]">
              <img src={checkIcon} alt="" className="w-[20px] h-[20px] shrink-0" />
              <span>Список для сім'ї</span>
            </div>
          </div>

          <p className="font-inter text-[14px] font-medium text-[#6D8279] leading-[23.1px] m-0">
            Порівнюємо ціни, акції та магазини поруч з вами — без зайвих <br /> вкладок і довгого пошуку.
          </p>
        </div>

        {/* RIGHT — mockup */}
        <div className="flex-1 flex justify-end items-center">
          <img src={mockupCard} alt="Smarket кошик" className="w-full max-w-[500px] h-auto block" />
        </div>

      </div>
    </section>
  );
}
