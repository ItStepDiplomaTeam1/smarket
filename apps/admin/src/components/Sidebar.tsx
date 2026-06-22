import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@/store/useUiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Home, Package, Layers, Store, Percent, Activity, 
  FileText, MessageSquare, Users, LifeBuoy, Settings, ScrollText, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/Logo-Smarket.svg';

const topNavItems = [
  { name: 'Головна', path: '/', icon: <Home size={18} /> },
  { name: 'Товари', path: '/products', icon: <Package size={18} /> },
  { name: 'Категорії', path: '/categories', icon: <Layers size={18} /> },
  { name: 'Магазини', path: '/stores', icon: <Store size={18} /> },
  { name: 'Акції', path: '/promotions', icon: <Percent size={18} /> },
  { name: 'Парсери', path: '/parsers', icon: <Activity size={18} /> },
  { name: 'Сторінки', path: '/pages', icon: <FileText size={18} /> },
  { name: 'Повідомлення', path: '/messages', icon: <MessageSquare size={18} /> },
  { name: 'Клієнти', path: '/clients', icon: <Users size={18} /> },
  { name: 'Підтримка', path: '/support', icon: <LifeBuoy size={18} /> },
];

const bottomNavItems = [
  { name: 'Налаштування', path: '/settings', icon: <Settings size={18} /> },
  { name: 'Журнал дій', path: '/logs', icon: <ScrollText size={18} /> },
];

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useUiStore();
  const { logout } = useAuthStore();

  return (
    <aside 
      className={cn(
        "bg-surface border-r border-border h-full transition-all duration-300 ease-in-out flex flex-col z-20",
        isSidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
      )}
    >
      <div className="h-16 flex items-center px-6 border-b border-border min-w-[5rem]">
        {isSidebarOpen ? (
          <img src={logo} alt="Smarket Logo" className="h-6 w-auto" />
        ) : (
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-lg text-white shadow-sm mx-auto">
            S
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col overflow-y-auto overflow-x-hidden min-w-[5rem] custom-scrollbar">
        <ul className="flex flex-col gap-1 px-3">
          {topNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-secondary text-primary font-semibold" 
                    : "text-textMuted hover:bg-background hover:text-textMain font-medium"
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md"></span>
                    )}
                    <div className={cn("min-w-[1.25rem] flex items-center justify-center", !isSidebarOpen && "mx-auto")}>
                      {item.icon}
                    </div>
                    {isSidebarOpen && (
                      <span className="ml-3 whitespace-nowrap text-sm">{item.name}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto px-3 pt-4 border-t border-border mt-4">
          <ul className="flex flex-col gap-1">
            {bottomNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                    isActive 
                      ? "bg-secondary text-primary font-semibold" 
                      : "text-textMuted hover:bg-background hover:text-textMain font-medium"
                  )}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <div className={cn("min-w-[1.25rem] flex items-center justify-center", !isSidebarOpen && "mx-auto")}>
                    {item.icon}
                  </div>
                  {isSidebarOpen && (
                    <span className="ml-3 whitespace-nowrap text-sm">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={() => logout()}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-textMuted hover:bg-red-50 hover:text-accentRed font-medium",
                  !isSidebarOpen && "justify-center"
                )}
                title={!isSidebarOpen ? "Вийти" : undefined}
              >
                <div className="min-w-[1.25rem] flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                {isSidebarOpen && (
                  <span className="ml-3 whitespace-nowrap text-sm">Вийти</span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};
