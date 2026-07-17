import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchMe } from '@/hooks/api/useAuthApi';
import { apiClient } from '@/shared/api/apiClient';

// Light theme icons
import profileHomeLight from '@/shared/assets/profile-home.svg';
import profileCartLight from '@/shared/assets/profile-cart.svg';
import profileLikeLight from '@/shared/assets/profile-like.svg';
import profileReviewsLight from '@/shared/assets/profile-reviews.svg';
import settingsProfileLight from '@/shared/assets/settings-profile.svg';
import profileExitLight from '@/shared/assets/profile-exit.svg';

// Dark theme icons
import profileHomeDark from '@/shared/assets/homegreen.svg';
import profileCartDark from '@/shared/assets/green_basket.svg';
import profileLikeDark from '@/shared/assets/obrani_green.svg';
import profileReviewsDark from '@/shared/assets/reviews_green.svg';
import settingsProfileDark from '@/shared/assets/settings_green.svg';
import profileExitDark from '@/shared/assets/left_green.svg';

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
  return `hsl(${hue}, 55%, 43%)`;
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: meData } = useFetchMe();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Спостерігаємо за перемиканням теми в html
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Початкова ініціалізація
    setIsDark(document.documentElement.classList.contains('dark'));
    
    return () => observer.disconnect();
  }, []);

  // Навігаційні асети в залежності від теми
  const navItems = [
    { path: '/profile',           label: 'Особистий кабінет', icon: isDark ? profileHomeDark : profileHomeLight,    exact: true },
    { path: '/cart',              label: 'Ваші кошики',       icon: isDark ? profileCartDark : profileCartLight,    exact: false },
    { path: '/profile/favorites', label: 'Обрані товари',      icon: isDark ? profileLikeDark : profileLikeLight,    exact: false },
    { path: '/profile/reviews',   label: 'Відгуки',           icon: isDark ? profileReviewsDark : profileReviewsLight,  exact: false },
  ];

  const settingsItem = { path: '/profile/settings', label: 'Налаштування', icon: isDark ? settingsProfileDark : settingsProfileLight, exact: false };
  const exitIcon = isDark ? profileExitDark : profileExitLight;

  // Відображуване ім'я: ім'я зі стору або з /me
  const email = user?.email;
  const userCity = (email ? localStorage.getItem(`smarket_user_city_${email}`) : null) || meData?.settings?.city || 'Київ';
  const locationLabel = `${userCity}, Україна`;

  const displayName = user?.name || meData?.username || user?.email || 'Користувач';
  const initials = getInitials(user?.name, user?.email);
  const avatarColor = stringToHsl(user?.email ?? user?.name ?? 'user');

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      if (!user) return 0;
      
      const DEFAULT_PHONE = '+38 000 000 00 00';
      const DEFAULT_CITY  = 'Київ';
      const DEFAULT_STORE = 'Всі магазини';
      
      const phone = localStorage.getItem(`smarket_user_phone_${email}`);
      const city = localStorage.getItem(`smarket_user_city_${email}`);
      const favoriteStore = localStorage.getItem(`smarket_user_favorite_store_${email}`);
      
      let count = 0;
      
      // 1. Ім'я
      if (user.name && user.name.trim().length > 0 && user.name.trim() !== 'Марина Добра') {
        count += 1;
      }
      // 2. Email
      if (email) {
        count += 1;
      }
      // 3. Телефон
      if (phone && phone.trim() !== '' && phone.trim() !== DEFAULT_PHONE) {
        count += 1;
      }
      // 4. Місто
      if (city && city.trim() !== '' && city.trim() !== DEFAULT_CITY) {
        count += 1;
      }
      // 5. Улюблений магазин
      if (favoriteStore && favoriteStore.trim() !== '' && favoriteStore !== DEFAULT_STORE) {
        count += 1;
      }
      
      return Math.round((count / 5) * 100);
    };

    setProgress(calculateProgress());

    const updateProgress = () => {
      setProgress(calculateProgress());
    };

    window.addEventListener('profile-updated', updateProgress);
    return () => {
      window.removeEventListener('profile-updated', updateProgress);
    };
  }, [user, email]);

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
      <li key={item.path}>
        <button
          onClick={() => navigate(item.path)}
          className={`flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] border transition-all text-left cursor-pointer transition-colors duration-200 ${
            active
              ? 'bg-[#EAF7F2] border-[#6FE3C2] text-[#265447] dark:bg-transparent dark:border-[#4ADE80] dark:text-[#4ADE80]'
              : 'bg-transparent border-transparent text-[#6D8279] dark:text-[#4ADE80] hover:bg-[#EAF7F2]/50 dark:hover:bg-[#173B33]'
          }`}
        >
          <img src={item.icon} alt={item.label} className="w-[20px] h-[20px] flex-shrink-0" />
          <span className={`text-[14px] leading-none mt-[2px] ${active ? 'font-semibold' : 'font-normal'}`}>
            {item.label}
          </span>
        </button>
      </li>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-full lg:w-[235px] shrink-0 py-[24px] px-[16px] border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[16px] gap-[36px] bg-white dark:bg-[#1C2723] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] font-inter">
      
      {/* Блок профілю */}
      <div className="flex flex-col w-[202px] gap-[12px] items-center mx-auto text-center">
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
        <div className="flex flex-col w-[202px] gap-[6px] items-center">
          <h2 className="text-[14px] font-semibold text-[#265447] dark:text-white leading-none truncate text-center w-full">{displayName}</h2>
          <p className="text-[12px] font-normal text-[#265447] dark:text-white leading-none truncate text-center w-full">{locationLabel}</p>
        </div>
        <div className="flex flex-col w-full gap-[12px] items-center">
          <span className="text-[12px] font-semibold text-[#265447] dark:text-white leading-none text-center w-full">Профіль заповнено на {progress}%</span>
          <div className="w-full h-[7px] bg-[#F0F5F3] dark:bg-[#173B33] rounded-[20px] overflow-hidden">
            <div className="h-full bg-[#265447] dark:bg-[#4ADE80] rounded-[20px] transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Блок навігації */}
      <nav className="w-full flex justify-center">
        <ul className="flex flex-col gap-1 w-[202px]">
          {navItems.map(renderNavItem)}

          <div className="py-2">
             <hr className="w-full border-t border-[#E5E7EB] dark:border-[#265447]" />
          </div>

          {renderNavItem(settingsItem)}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#6D8279] dark:text-[#4ADE80] hover:bg-[#F6FAF8] dark:hover:bg-[#173B33] transition-all text-left cursor-pointer transition-colors duration-200"
            >
              <img src={exitIcon} alt="Exit" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Вийти</span>
            </button>
          </li>
        </ul>
      </nav>

    </aside>
  );
};

export default Sidebar;