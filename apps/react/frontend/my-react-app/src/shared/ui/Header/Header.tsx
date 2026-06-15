import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import lupa from '@/shared/assets/lupa.svg';
import koshuk from '@/shared/assets/koshuk.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';
import { useAuthStore } from '@/modules/Auth/store/authStore';

function getInitials(name?: string, email?: string): string {
    if (name && name.trim()) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return '??';
}

function getDisplayName(name?: string, email?: string): string {
    if (name && name.trim()) return name.trim().split(' ')[0];
    if (email) return email.split('@')[0];
    return 'Користувач';
}

// Generates a stable HSL color from a string
function stringToHsl(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 38%)`;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `no-underline text-sm font-medium transition-colors duration-200 ${
        isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'
    }`;

export interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-[#E5E7EB] h-[72px] sticky top-0 z-50">
      <div className="max-w-[1228px] mx-auto px-6 h-full flex justify-between items-center">

        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            onNavigate?.('product');
          }}
          className="flex items-center h-full py-0"
        >
          <img src={fix_logo} alt="Smarket Logo" className="h-8 w-auto block object-contain" />
        </a>

        <nav className="flex items-center gap-8">
          <a href="#" className="no-underline text-[#173B33] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Акції</a>
          <a href="#" className="no-underline text-[#173B33] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Порівняти ціни</a>
          <a href="#" className="no-underline text-[#173B33] text-sm font-medium hover:text-[#265447] transition-colors duration-200">Магазини</a>
          <a 
            href="#cart" 
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.('cart');
            }}
            className="no-underline text-[#173B33] text-sm font-medium hover:text-[#265447] transition-colors duration-200"
          >
            Кошик
          </a>
        </nav>

        <div className="flex items-center gap-5">
          <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0">
            <img src={lupa} alt="Search" className="w-5 h-5 block" />
          </button>
          <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0">
            <img src={people} alt="Profile" className="w-5 h-5 block" />
          </button>
          <button 
            className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0"
            onClick={() => onNavigate?.('cart')}
          >
            <img src={koshuk} alt="Basket" className="w-5 h-5 block" />
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;
