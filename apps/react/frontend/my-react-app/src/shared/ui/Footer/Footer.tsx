import logo from '@/shared/assets/logo.svg';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E5E7EB] pt-10 pb-6">
      <div className="max-w-[1228px] mx-auto px-6 flex flex-col gap-10">

        {/* Верхня частина футеру */}
        <div className="flex justify-between items-start">
          
          {/* Блок з логотипом та описом */}
          <div className="flex flex-col gap-[16px] w-[298px]">
            <img src={logo} alt="Smarket" className="w-[120px] h-[33px] block" />
            <p className="font-inter text-[14px] font-medium leading-[23px] text-[#6D8279] m-0">
              Smarket — сервіс для розумного порівняння цін і планування покупок.
            </p>
          </div>

          {/* Блок посилань (3 колонки) */}
          <div className="flex gap-[80px] m-0 p-0">
            {/* 1 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Акції</a>
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Магазини</a>
            </div>

            {/* 2 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Категорії</a>
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Як це працює</a>
            </div>

            {/* 3 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="/ConfidentialPolicy" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Політика конфіденційності</a>
              <a href="/UsingConditions" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Умови використання</a>
              <a href="/Privacy" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Обробка персональних даних</a>
            </div>
          </div>

        </div>

        {/* Нижня частина (Копірайт) */}
        <div className="pt-6 border-t border-[rgba(38,84,71,0.08)] text-center">
          <p className="font-inter text-[13px] font-normal text-[#6D8279] m-0">
            © 2026 Smarket. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}