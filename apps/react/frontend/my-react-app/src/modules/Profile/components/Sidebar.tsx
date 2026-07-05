import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchMe } from '@/hooks/api/useAuthApi';

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

export const Sidebar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: meData } = useFetchMe();

  // Відображуване ім'я: ім'я з /me або email із стору
  const displayName = meData?.username || user?.name || user?.email || 'Користувач';
  const initials = getInitials(user?.name, user?.email);
  const avatarColor = stringToHsl(user?.email ?? user?.name ?? 'user');

  const progress = user?.name ? 40 : 20;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="flex flex-col w-[235px] shrink-0 py-[24px] px-[16px] border border-[#265447]/[0.08] rounded-[16px] gap-[36px] bg-white shadow-[0_4px_12px_rgba(23,59,51,0.06)] font-inter">
      
      {/* Блок профілю */}
      <div className="flex flex-col w-[202px] gap-[12px] items-start mx-auto">
        <div
          className="w-[100px] h-[100px] rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-[32px] font-bold select-none"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex flex-col w-[202px] gap-[6px]">
          <h2 className="text-[14px] font-semibold text-[#265447] leading-none truncate">{displayName}</h2>
          <p className="text-[12px] font-normal text-[#265447] leading-none truncate">Галактика SMARKET</p>
        </div>
        <div className="flex flex-col w-full gap-[12px]">
          <span className="text-[12px] font-normal text-[#265447] leading-none">Профіль заповнено на {progress}%</span>
          <div className="w-full h-[7px] bg-[#265447]/10 rounded-[20px] overflow-hidden">
            <div className="h-full bg-[#265447] rounded-[20px] transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Блок навігації */}
      <nav className="w-full flex justify-center">
        <ul className="flex flex-col gap-1 w-[202px]">
          <li>
            <a href="#" className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-[#EAF7F2] border border-[#6FE3C2] text-[#265447] transition-all">
              <img src={profileHome} alt="Home" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-semibold leading-none mt-[2px]">Особистий кабінет</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all">
              <img src={profileCart} alt="Cart" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Ваші кошики</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all">
              <img src={profileLike} alt="Like" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Обрані товари</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all">
              <img src={profileReviews} alt="Reviews" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Відгуки</span>
            </a>
          </li>

          <div className="py-2">
             <hr className="w-full border-t border-[#6FE3C2]" />
          </div>

          <li>
            <a href="#" className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all">
              <img src={settingsProfile} alt="Settings" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Налаштування</span>
            </a>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all text-left cursor-pointer"
            >
              <img src={profileExit} alt="Exit" className="w-[20px] h-[20px] flex-shrink-0" />
              <span className="text-[14px] font-normal leading-none mt-[2px]">Вийти</span>
            </button>
          </li>
        </ul>
      </nav>

    </aside>
  );
};

export default Sidebar;