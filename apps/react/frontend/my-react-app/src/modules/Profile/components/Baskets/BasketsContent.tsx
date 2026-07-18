import { useNavigate } from 'react-router-dom';

export function BasketsContent() {
  const navigate = useNavigate();
  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] mb-[12px]">
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors" onClick={() => navigate('/')}>Головна</span>
          <span className="mx-[2px]">›</span>
          <span className="cursor-pointer hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors" onClick={() => navigate('/profile')}>Особистий кабінет</span>
          <span className="mx-[2px]">›</span>
          <span className="text-[#265447] dark:text-[#94A3B8] font-semibold">Ваші кошики</span>
        </div>

        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[24px]">
          Ваші кошики
        </h1>

        <div className="flex flex-col items-center justify-center py-[64px] bg-white dark:bg-[#1D2A25] border border-[#265447]/[0.08] dark:border-[#265447]/30 rounded-[16px] shadow-[0_4px_12px_rgba(23,59,51,0.06)] transition-colors">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-[16px]">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <p className="font-manrope font-semibold text-[16px] text-[#265447] dark:text-[#3DAE8B] m-0 mb-[6px]">Сторінка в розробці</p>
          <p className="font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] m-0">Управління кошиками скоро буде доступне тут.</p>
        </div>
      </div>
    </section>
  );
}
