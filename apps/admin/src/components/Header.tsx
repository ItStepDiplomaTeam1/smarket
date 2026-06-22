import React from 'react';
import { useUiStore } from '@/store/useUiStore';
import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUiStore();
  useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-secondary text-textMuted hover:text-primary transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex relative w-full max-w-md ml-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-textMuted" />
          </div>
          <input 
            type="text" 
            placeholder="Пошук товарів, категорій, замовлень" 
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-surface"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-secondary text-textMuted hover:text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accentGreen rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-secondary p-1 rounded-lg transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#E2E8F0] overflow-hidden flex items-center justify-center border border-border">
             <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:flex flex-col">
            <p className="text-sm font-semibold text-textMain leading-tight">Олександр</p>
            <p className="text-xs text-textMuted leading-tight">Адміністратор</p>
          </div>
          <ChevronDown size={16} className="text-textMuted hidden md:block" />
        </div>
      </div>
    </header>
  );
};
