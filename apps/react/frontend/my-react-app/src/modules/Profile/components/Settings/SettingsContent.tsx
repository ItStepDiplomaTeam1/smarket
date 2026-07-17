export function SettingsContent() {
  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] mb-[12px]">
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors">Головна</span>
          <span className="mx-[2px]">›</span>
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors">Особистий кабінет</span>
          <span className="mx-[2px]">›</span>
          <span className="text-[#265447] dark:text-[#EAF7F2] font-semibold">Налаштування</span>
        </div>

        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[24px]">
          Налаштування
        </h1>

        <div className="flex flex-col items-center justify-center py-[64px] bg-white dark:bg-[#1D2A25] border border-[#265447]/[0.08] dark:border-[#265447]/30 rounded-[16px] shadow-[0_4px_12px_rgba(23,59,51,0.06)] transition-colors">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <p className="font-manrope font-semibold text-[16px] text-[#265447] dark:text-[#3DAE8B] m-0 mb-[6px]">Сторінка в розробці</p>
          <p className="font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] m-0">Налаштування профілю скоро буде доступне тут.</p>
        </div>
      </div>
    </section>
  );
}
