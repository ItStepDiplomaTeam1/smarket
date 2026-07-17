import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchMe } from '@/hooks/api/useAuthApi';
import { apiClient } from '@/shared/api/apiClient';

import profileHome from '@/shared/assets/profile-home.svg';
import profileCart from '@/shared/assets/profile-cart.svg';
import profileLike from '@/shared/assets/profile-like.svg';
import profileReviews from '@/shared/assets/profile-reviews.svg';
import settingsProfile from '@/shared/assets/settings-profile.svg';
import profileExit from '@/shared/assets/profile-exit.svg';

function getInitials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function stringToHsl(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 38%)`;
}

/** Пункти навігації профілю */
const navItems = [
  { path: '/profile',           label: 'Особистий кабінет', icon: profileHome,    exact: true },
  { path: '/cart',   label: 'Ваші кошики',       icon: profileCart,     exact: false },
  { path: '/profile/favorites', label: 'Обрані товари',      icon: profileLike,    exact: false },
  { path: '/profile/reviews',   label: 'Відгуки',           icon: profileReviews,  exact: false },
];

const settingsItem = { path: '/profile/settings', label: 'Налаштування', icon: settingsProfile, exact: false };

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: meData } = useFetchMe();

  // Відображуване ім'я: ім'я з /me або email із стору
  const displayName = meData?.username || user?.name || user?.email || 'Користувач';
  const initials = getInitials(user?.name, user?.email);
  const avatarColor = stringToHsl(user?.email ?? user?.name ?? 'user');

  const progress = user?.name ? 40 : 20;

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Clear local state regardless of server response
    }
    logout();
    navigate('/');
  };

  /** Перевірка чи поточний роут активний */
  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  /** Рендер навігаційного пункту */
  const renderNavItem = (item: { path: string; label: string; icon: string; exact: boolean }) => {
    const active = isActive(item.path, item.exact);
    return (
      <li key={item.path} className="w-full">
        <button
          onClick={() => navigate(item.path)}
          className={`flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] border transition-all text-left cursor-pointer ${
            active
              ? 'bg-[#EAF7F2] dark:bg-[#265447]/30 border-[#6FE3C2] dark:border-[#3DAE8B]/60 text-[#265447] dark:text-[#3DAE8B]'
              : 'bg-transparent border-transparent text-[#265447] dark:text-[#EAF7F2] hover:bg-[#EAF7F2] dark:hover:bg-[#265447]/20 hover:border-[#6FE3C2] dark:hover:border-[#3DAE8B]/40'
          }`}
        >
          <img src={item.icon} alt={item.label} className="w-[20px] h-[20px] flex-shrink-0 dark:brightness-125" />
          <span className={`text-[14px] leading-none mt-[2px] ${active ? 'font-semibold' : 'font-normal'}`}>
            {item.label}
          </span>
        </button>
      </li>
    );
  };

  return (
    <aside className="flex flex-col w-full md:w-[235px] shrink-0 py-[24px] px-[16px] border border-[#265447]/[0.08] dark:border-[#265447]/30 rounded-[16px] gap-[36px] bg-white dark:bg-[#1D2A25] shadow-[0_4px_12px_rgba(23,59,51,0.06)] font-inter transition-colors">
      
      {/* Блок профілю */}
      <div className="flex flex-col w-full max-w-[202px] gap-[12px] items-start mx-auto md:items-start items-center text-center md:text-left">
        <div
          className="w-[100px] h-[100px] rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-[32px] font-bold select-none"
          style={{ backgroundColor: avatarColor }}
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex flex-col w-full gap-[6px]">
          <h2 className="text-[14px] font-semibold text-[#265447] dark:text-[#3DAE8B] leading-none truncate">{displayName}</h2>
          <p className="text-[12px] font-normal text-[#265447] dark:text-[#A9B6B0] leading-none truncate">Галактика SMARKET</p>
        </div>
        <div className="flex flex-col w-full gap-[12px]">
          <span className="text-[12px] font-normal text-[#265447] dark:text-[#A9B6B0] leading-none">Профіль заповнено на {progress}%</span>
          <div className="w-full h-[7px] bg-[#265447]/10 dark:bg-[#3DAE8B]/10 rounded-[20px] overflow-hidden">
            <div className="h-full bg-[#265447] dark:bg-[#3DAE8B] rounded-[20px] transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
 
      {/* Блок навігації */}
      <nav className="w-full flex justify-center">
        <ul className="flex flex-col gap-1 w-full max-w-[202px]">
          {navItems.map(renderNavItem)}
 
          <div className="py-2">
             <hr className="w-full border-t border-[#6FE3C2] dark:border-[#3DAE8B]/40" />
          </div>
 
          {renderNavItem(settingsItem)}
          <li className="w-full">
            <button
              onClick={handleLogout}
              className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] dark:text-[#EAF7F2] hover:bg-[#EAF7F2] dark:hover:bg-[#265447]/20 hover:border-[#6FE3C2] dark:hover:border-[#3DAE8B]/40 transition-all text-left cursor-pointer"
            >
              <img src={profileExit} alt="Exit" className="w-[20px] h-[20px] flex-shrink-0 dark:brightness-125" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Вийти</span>
            </button>
          </li>
        </ul>
      </nav>
 
    </aside>
  );
};
 
export default Sidebar;