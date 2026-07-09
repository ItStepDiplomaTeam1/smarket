import logo from '@/shared/assets/logo.svg';

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#0B120F] border-t border-[#E5E7EB] dark:border-[rgba(255,255,255,0.02)] pt-10 pb-6 transition-colors duration-300">
      <div className="max-w-[1228px] mx-auto px-6 flex flex-col gap-10">

        {/* Верхня частина футеру */}
        <div className="flex justify-between items-start">
          
          {/* Блок з логотипом та описом */}
          <div className="flex flex-col gap-[16px] w-[298px]">
            {/* Фільтри роблять логотип білим у темній темі */}
            <img src={logo} alt="Smarket" className="w-[120px] h-[33px] block dark:brightness-0 dark:invert transition-all" />
            <p className="font-inter text-[14px] font-medium leading-[23px] text-[#6D8279] dark:text-[#81998F] m-0 transition-colors">
              Smarket — сервіс для розумного порівняння цін і планування покупок.
            </p>
          </div>

          {/* Блок посилань (3 колонки) */}
          <div className="flex gap-[80px] m-0 p-0">
            {/* 1 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Акції</a>
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Магазини</a>
            </div>

            {/* 2 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Категорії</a>
              <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Як це працює</a>
            </div>

            {/* 3 колонка */}
            <div className="flex flex-col gap-[12px]">
              <a href="/ConfidentialPolicy" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Політика конфіденційності</a>
              <a href="/UsingConditions" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Умови використання</a>
              <a href="/Privacy" className="font-inter text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Обробка персональних даних</a>
            </div>
          </div>

        </div>

        {/* Нижня частина (Копірайт) */}
        <div className="pt-6 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.05)] text-center transition-colors">
          <p className="font-inter text-[13px] font-normal text-[#6D8279] dark:text-[#81998F] m-0 transition-colors">
            © 2026 Smarket. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}