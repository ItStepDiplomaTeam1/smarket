import lupa from '@/shared/assets/lupa.svg';
import koshuk from '@/shared/assets/koshuk.svg';
import people from '@/shared/assets/people.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';

import { NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="w-full bg-white border-b border-[#E5E7EB] h-[72px] sticky top-0 z-50">
      <div className="max-w-[1228px] mx-auto px-6 h-full flex justify-between items-center">

        <a href="/" className="flex items-center h-full py-0">
          <img src={fix_logo} alt="Smarket Logo" className="h-8 w-auto block object-contain" />
        </a>

        <nav className="flex items-center gap-8">
            <NavLink 
                to="/promotions" 
                className={({ isActive }) => `no-underline text-sm font-medium transition-colors duration-200 
                    ${isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'}`
                }>
                Акції
            </NavLink>

            <NavLink 
                to="/compare" 
                className={({ isActive }) => `no-underline text-sm font-medium transition-colors duration-200 
                    ${isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'}`
                }>
                Порівняти ціни
            </NavLink>

            <NavLink 
                to="/stores" 
                className={({ isActive }) => `no-underline text-sm font-medium transition-colors duration-200 
                    ${isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'}`
                }>
                Магазини
            </NavLink>

            <NavLink 
                to="/cart" 
                className={({ isActive }) => `no-underline text-sm font-medium transition-colors duration-200 
                    ${isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'}`
                }>
                Кошик
            </NavLink>
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
