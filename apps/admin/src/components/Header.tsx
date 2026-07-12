import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { apiClient } from '@/lib/apiClient';
import logo from '@/assets/HeaderIcons/Logo-Smarket.svg';
import sidebarIcon from '@/assets/SidebarIcons/Sidebar.svg';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, setTheme } = useUiStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      // Ask the auth service to invalidate the refresh_token cookie
      await apiClient.post('/auth/logout');
    } catch {
      // Even if the request fails, clear local state and redirect
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const displayName = user?.email?.split('@')[0] ?? 'Адміністратор';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-[68px] w-full flex items-center justify-between px-6 bg-surface border-b border-border z-10 sticky top-0 shrink-0">
      {/* Left side: Logo */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Smarket" className="h-7 w-auto shrink-0" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle isDark={isDarkMode} onChange={setTheme} />

        {/* Bell */}
        <button className="relative p-2 rounded-full hover:bg-secondary text-textMuted hover:text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accentGreen rounded-full border border-white" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20 shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <p className="text-sm font-semibold text-textMain leading-tight capitalize">{displayName}</p>
              <p className="text-xs text-textMuted leading-tight">Адміністратор</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-textMuted hidden md:block transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-textMain capitalize">{displayName}</p>
                <p className="text-xs text-textMuted truncate">{user?.email}</p>
              </div>

              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-textMain hover:bg-secondary transition-colors"
                onClick={() => { setMenuOpen(false); }}
              >
                <User size={15} className="text-textMuted" />
                Мій профіль
              </button>

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accentRed hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Вийти
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -mr-1 rounded-lg hover:bg-secondary text-[#265447] transition-colors lg:hidden shrink-0"
          title="Меню"
        >
          <img src={sidebarIcon} alt="Меню" className="w-[18px] h-[18px] object-contain shrink-0" />
        </button>
      </div>
    </header>
  );
};
