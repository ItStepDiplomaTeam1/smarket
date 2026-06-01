import logo from '../assets/logo.svg';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E5E7EB] pt-10 pb-6">
      <div className="max-w-[1228px] mx-auto px-6 flex flex-col gap-8">

        {/* Top row: logo+desc left, nav links right */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-3 max-w-[280px]">
            <img src={logo} alt="Smarket" className="h-7 w-auto block" />
            <p className="font-inter text-[13px] font-normal leading-[22px] text-[#6D8279] m-0">
              Smarket — сервіс для розумного порівняння цін і планування покупок.
            </p>
          </div>

          {/* Nav links — screenshot shows 4 links, right-aligned */}
          <nav className="flex gap-8 items-start pt-1">
            <a href="#" className="font-inter text-sm font-medium text-[#6D8279] no-underline hover:text-[#173B33] transition-colors duration-200">Акції</a>
            <a href="#" className="font-inter text-sm font-medium text-[#6D8279] no-underline hover:text-[#173B33] transition-colors duration-200">Магазини</a>
            <a href="#" className="font-inter text-sm font-medium text-[#6D8279] no-underline hover:text-[#173B33] transition-colors duration-200">Категорії</a>
            <a href="#" className="font-inter text-sm font-medium text-[#6D8279] no-underline hover:text-[#173B33] transition-colors duration-200">Як це працює</a>
          </nav>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[rgba(38,84,71,0.08)] text-center">
          <p className="font-inter text-[12px] font-normal text-[#9CA3AF] m-0">
            © 2026 Smarket. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}