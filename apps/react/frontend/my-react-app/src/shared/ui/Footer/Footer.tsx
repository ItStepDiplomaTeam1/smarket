import logo from '@/shared/assets/logo.svg';

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#0B120F] border-t border-[#E5E7EB] dark:border-[rgba(255,255,255,0.02)] pt-10 pb-6 transition-colors duration-300">
      <div className="max-w-[1228px] mx-auto px-4 md:px-6 flex flex-col gap-8 md:gap-10">

        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0">
          
          <div className="flex flex-col gap-4 w-full md:w-[298px]">
            <img src={logo} alt="Smarket" className="w-[100px] md:w-[120px] h-auto block dark:brightness-0 dark:invert transition-all" />
            <p className="font-inter text-[13px] md:text-[14px] font-medium leading-[22px] md:leading-[23px] text-[#6D8279] dark:text-[#81998F] m-0">
              Smarket — сервіс для розумного порівняння цін і планування покупок.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-[60px] md:gap-[80px] w-full md:w-auto">
            <div className="flex flex-col gap-3">
              <a href="#" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Акції</a>
              <a href="#" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Магазини</a>
            </div>

            <div className="flex flex-col gap-3">
              <a href="#" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Категорії</a>
              <a href="#" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Як це працює</a>
            </div>

            <div className="flex flex-col gap-3">
              <a href="/ConfidentialPolicy" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Політика конфіденційності</a>
              <a href="/UsingConditions" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Умови використання</a>
              <a href="/Privacy" className="font-inter text-[13px] md:text-[14px] font-medium text-[#173B33] dark:text-[#EAEAEA] no-underline hover:opacity-80 transition-opacity">Обробка персональних даних</a>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.05)] text-center">
          <p className="font-inter text-[12px] md:text-[13px] font-normal text-[#6D8279] dark:text-[#81998F] m-0">
            © 2026 Smarket. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}