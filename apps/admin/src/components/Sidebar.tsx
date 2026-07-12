import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
// Using custom SVG icons from SidebarIcons folder
import { cn } from '@/lib/utils';
import logo from '@/assets/HeaderIcons/Logo-Smarket.svg';

import homeActive from '@/assets/SidebarIcons/Home - active.svg';
import homeInactive from '@/assets/SidebarIcons/Home - inactive.svg';
import productsActive from '@/assets/SidebarIcons/Products - active.svg';
import productsInactive from '@/assets/SidebarIcons/Products -inactive.svg';
import storesActive from '@/assets/SidebarIcons/Stores - active.svg';
import storesInactive from '@/assets/SidebarIcons/Stores - inactive.svg';
import usersActive from '@/assets/SidebarIcons/Users - active.svg';
import usersInactive from '@/assets/SidebarIcons/Users - inactive.svg';
import mailsActive from '@/assets/SidebarIcons/Mails - active.svg';
import mailsInactive from '@/assets/SidebarIcons/Mails - inactive.svg';
import settingsActive from '@/assets/SidebarIcons/Settings - active.svg';
import settingsInactive from '@/assets/SidebarIcons/Settings - inactive.svg';
import logsActive from '@/assets/SidebarIcons/Logs - active.svg';
import logsInactive from '@/assets/SidebarIcons/Logs - inactive.svg';

const CategoriesIcon: React.FC = () => (
  <svg 
    width="17" 
    height="14" 
    viewBox="0 0 17 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="shrink-0 sidebar-icon"
  >
    <path d="M0 1.03125C0 0.757746 0.108649 0.495443 0.302046 0.302046C0.495443 0.108649 0.757746 0 1.03125 0H11.3438C11.6173 0 11.8796 0.108649 12.073 0.302046C12.2663 0.495443 12.375 0.757746 12.375 1.03125C12.375 1.30475 12.2663 1.56706 12.073 1.76045C11.8796 1.95385 11.6173 2.0625 11.3438 2.0625H1.03125C0.757746 2.0625 0.495443 1.95385 0.302046 1.76045C0.108649 1.56706 0 1.30475 0 1.03125ZM0 12.0312C0 11.7577 0.108649 11.4954 0.302046 11.302C0.495443 11.1087 0.757746 11 1.03125 11H9.96875C10.2423 11 10.5046 11.1087 10.698 11.302C10.8913 11.4954 11 11.7577 11 12.0312C11 12.3048 10.8913 12.5671 10.698 12.7605C10.5046 12.9538 10.2423 13.0625 9.96875 13.0625H1.03125C0.757746 13.0625 0.495443 12.9538 0.302046 12.7605C0.108649 12.5671 0 12.3048 0 12.0312ZM1.03125 5.5C0.757746 5.5 0.495443 5.60865 0.302046 5.80205C0.108649 5.99544 0 6.25775 0 6.53125C0 6.80475 0.108649 7.06706 0.302046 7.26045C0.495443 7.45385 0.757746 7.5625 1.03125 7.5625H15.4688C15.7423 7.5625 16.0046 7.45385 16.198 7.26045C16.3913 7.06706 16.5 6.80475 16.5 6.53125C16.5 6.25775 16.3913 5.99544 16.198 5.80205C16.0046 5.60865 15.7423 5.5 15.4688 5.5H1.03125Z" fill="currentColor"/>
  </svg>
);

const ExitIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('sidebar-icon', className)}>
    <path d="M9.85417 0.6875H0.6875V13.5208C0.6875 14.0071 0.880654 14.4734 1.22447 14.8172C1.56829 15.161 2.0346 15.3542 2.52083 15.3542H9.85417M10.7708 5.27083L13.5208 8.02083L10.7708 10.7708M13.5208 8.02083H4.35417" stroke="currentColor" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const mainNavItems = [
  { name: 'Головна',      path: '/',            iconOutline: homeInactive, iconFilled: homeActive },
  { name: 'Товари',       path: '/products',    iconOutline: productsInactive, iconFilled: productsActive },
  { name: 'Категорії',    path: '/categories',  iconOutline: CategoriesIcon, iconFilled: CategoriesIcon },
  { name: 'Магазини',     path: '/stores',      iconOutline: storesInactive, iconFilled: storesActive },
  { name: 'Клієнти',      path: '/clients',     iconOutline: usersInactive, iconFilled: usersActive },
  { name: 'Підтримка',    path: '/support',     iconOutline: mailsInactive, iconFilled: mailsActive },
];

const bottomNavItems = [
  { name: 'Налаштування', path: '/settings', iconOutline: settingsInactive, iconFilled: settingsActive },
  { name: 'Журнал дій',   path: '/logs',     iconOutline: logsInactive, iconFilled: logsActive },
];

interface NavItemProps {
  name: string;
  path: string;
  iconOutline: string | React.ComponentType;
  iconFilled: string | React.ComponentType;
}

const NavItem: React.FC<NavItemProps & { onClick?: () => void }> = ({ name, path, iconOutline, iconFilled, onClick }) => (
  <NavLink
    to={path}
    end={path === '/'}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 select-none font-sans sidebar-nav-item',
        isActive
          ? 'bg-[#EBF6F1] dark:bg-white/5 font-semibold border sidebar-active-border'
          : 'font-medium border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
      )
    }
  >
    {({ isActive }) => {
      const Icon = isActive ? iconFilled : iconOutline;
      return (
        <>
          <div className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
            {typeof Icon === 'string' ? (
              <img
                src={Icon}
                alt={name}
                className="w-[18px] h-[18px] object-contain shrink-0 sidebar-icon"
              />
            ) : (
              React.createElement(Icon)
            )}
          </div>
          <span className="truncate">{name}</span>
        </>
      );
    }}
  </NavLink>
);

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();

  return (
    <aside
      className={cn(
        "w-[210px] shrink-0 bg-surface rounded-xl shadow-sm border border-border flex flex-col overflow-hidden pt-4 transition-all duration-200 font-sans",
        "hidden lg:flex",
        isOpen
          ? "fixed inset-y-4 left-4 flex z-50 shadow-2xl animate-in slide-in-from-left duration-200 font-sans"
          : "hidden"
      )}
    >

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <NavItem key={item.path} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-border my-1" />

      {/* Bottom section */}
      <div className="px-3 pt-1 pb-3 flex flex-col gap-0.5">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} {...item} onClick={onClose} />
        ))}

        {/* Divider before logout */}
        <div className="mx-1 border-t border-border my-1" />

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium sidebar-nav-item hover:bg-red-500/10 hover:text-accentRed transition-all duration-150 text-left group font-sans"
        >
          <ExitIcon className="sidebar-nav-item group-hover:text-accentRed shrink-0" />
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  );
};
