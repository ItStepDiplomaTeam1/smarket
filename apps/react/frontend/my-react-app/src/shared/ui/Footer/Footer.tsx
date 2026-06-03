import logo from '@/assets/logo.svg';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E5E7EB] pt-10 pb-6">
      <div className="max-w-[1228px] mx-auto px-6 flex flex-col gap-10">

        <div className="flex justify-between items-start">
          
          <div className="flex flex-col gap-[16px] w-[298px]">
            <img src={logo} alt="Smarket" className="w-[120px] h-[33px] block" />
            <p className="font-inter text-[14px] font-medium leading-[23px] text-[#6D8279] m-0">
              Smarket — сервіс для розумного порівняння цін і планування покупок.
            </p>
          </div>

          <nav className="flex gap-[32px] m-0 p-0">
            <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Акції</a>
            <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Магазини</a>
            <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Категорії</a>
            <a href="#" className="font-inter text-[14px] font-medium text-[#173B33] no-underline hover:opacity-80 transition-opacity">Як це працює</a>
          </nav>

        </div>

        <div className="pt-6 border-t border-[rgba(38,84,71,0.08)] text-center">
          <p className="font-inter text-[13px] font-normal text-[#6D8279] m-0">
            © 2026 Smarket. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
