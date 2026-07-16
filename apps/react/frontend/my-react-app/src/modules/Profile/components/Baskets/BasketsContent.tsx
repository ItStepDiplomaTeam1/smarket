export function BasketsContent() {
  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
          <span className="cursor-pointer hover:text-[#3DAE8B] transition-colors">Головна</span>
          <span className="mx-[2px]">›</span>
          <span className="cursor-pointer hover:text-[#3DAE8B] transition-colors">Особистий кабінет</span>
          <span className="mx-[2px]">›</span>
          <span className="text-[#94A3B8] font-semibold">Ваші кошики</span>
        </div>

        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-white m-0 mb-[24px]">
          Ваші кошики
        </h1>

        <div className="flex flex-col items-center justify-center py-[64px] bg-[#1C2723] border border-[#265447]/30 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <p className="font-manrope font-semibold text-[16px] text-white m-0 mb-[6px]">Сторінка в розробці</p>
          <p className="font-inter text-[13px] text-[#94A3B8] m-0">Управління кошиками скоро буде доступне тут.</p>
        </div>
      </div>
    </section>
  );
}
