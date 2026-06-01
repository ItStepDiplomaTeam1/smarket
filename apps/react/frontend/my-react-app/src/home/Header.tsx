import lupa from '../assets/lupa.svg';
import koshuk from '../assets/koshuk.svg';
import people from '../assets/people.svg';
import fix_logo from '../assets/Logo-Smarket.svg';

export function Header() {
  return (
    <header className="w-full bg-white border-b border-[#E5E7EB] h-[72px] sticky top-0 z-50">
      <div className="max-w-[1228px] mx-auto px-6 h-full flex justify-between items-center">

        <a href="/" className="flex items-center h-full py-0">
          <img src={fix_logo} alt="Smarket Logo" className="h-8 w-auto block object-contain" />
        </a>

        <nav className="flex items-center gap-8">
          {/* Screenshot: nav links are dark #111827, not green */}
          <a href="#" className="no-underline text-[#111827] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Акції</a>
          <a href="#" className="no-underline text-[#111827] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Порівняти ціни</a>
          <a href="#" className="no-underline text-[#111827] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Магазини</a>
          <a href="#" className="no-underline text-[#111827] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Кошик</a>
        </nav>

        <div className="flex items-center gap-5">
          <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0">
            <img src={lupa} alt="Search" className="w-5 h-5 block" />
          </button>
          <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0">
            <img src={people} alt="Profile" className="w-5 h-5 block" />
          </button>
          <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0">
            <img src={koshuk} alt="Basket" className="w-5 h-5 block" />
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;