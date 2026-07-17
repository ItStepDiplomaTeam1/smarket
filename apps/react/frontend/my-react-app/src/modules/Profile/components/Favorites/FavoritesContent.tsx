export function FavoritesContent() {
  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] mb-[12px]">
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors">Головна</span>
          <span className="mx-[2px]">›</span>
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors">Особистий кабінет</span>
          <span className="mx-[2px]">›</span>
          <span className="text-[#265447] dark:text-[#EAF7F2] font-semibold">Обрані товари</span>
        </div>

        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[24px]">
          Обрані товари
        </h1>

        <div className="flex flex-col items-center justify-center py-[64px] bg-white dark:bg-[#1D2A25] border border-[#265447]/[0.08] dark:border-[#265447]/30 rounded-[16px] shadow-[0_4px_12px_rgba(23,59,51,0.06)] transition-colors">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p className="font-manrope font-semibold text-[16px] text-[#265447] dark:text-[#3DAE8B] m-0 mb-[6px]">Сторінка в розробці</p>
          <p className="font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] m-0">Ваші обрані товари скоро з'являться тут.</p>
        </div>
      </div>
    </section>
  );
}
