import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Home, Package, Layers, Store, 
  FileText, MessageSquare, Users, LifeBuoy, 
  Settings, ScrollText, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/Logo-Smarket.svg';
 
const mainNavItems = [
  { name: 'Головна',      path: '/',            icon: Home },
  { name: 'Товари',       path: '/products',    icon: Package },
  { name: 'Категорії',    path: '/categories',  icon: Layers },
  { name: 'Магазини',     path: '/stores',      icon: Store },
  { name: 'Сторінки',     path: '/pages',       icon: FileText },
  { name: 'Повідомлення', path: '/messages',    icon: MessageSquare },
  { name: 'Клієнти',      path: '/clients',     icon: Users },
  { name: 'Підтримка',    path: '/support',     icon: LifeBuoy },
];

const bottomNavItems = [
  { name: 'Налаштування', path: '/settings', icon: Settings },
  { name: 'Журнал дій',   path: '/logs',     icon: ScrollText },
];

interface NavItemProps {
  name: string;
  path: string;
  icon: React.ElementType;
}

const NavItem: React.FC<NavItemProps> = ({ name, path, icon: Icon }) => (
  <NavLink
    to={path}
    end={path === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 select-none',
        isActive
          ? 'bg-[#EBF6F1] text-primary font-semibold border border-primary/20'
          : 'text-[#374151] font-medium hover:bg-[#F6FAF8] hover:text-primary'
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={18}
          strokeWidth={1.75}
          className={isActive ? 'text-primary shrink-0' : 'text-[#6B7280] shrink-0'}
        />
        <span className="truncate">{name}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();

  return (
    <aside className="w-[210px] shrink-0 bg-surface rounded-xl shadow-sm border border-border flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 shrink-0">
        <img src={logo} alt="Smarket" className="h-7 w-auto" />
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-border my-1" />

      {/* Bottom section */}
      <div className="px-3 pt-1 pb-3 flex flex-col gap-0.5">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* Divider before logout */}
        <div className="mx-1 border-t border-border my-1" />

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-red-50 hover:text-red-500 transition-all duration-150 text-left"
        >
          <LogOut size={18} strokeWidth={1.75} className="text-[#6B7280] shrink-0" />
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  );
};
