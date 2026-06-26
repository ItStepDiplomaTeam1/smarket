import React from 'react';

import profileHome from '@/shared/assets/profile-home.svg';
import profileCart from '@/shared/assets/profile-cart.svg';
import profileLike from '@/shared/assets/profile-like.svg';
import profileReviews from '@/shared/assets/profile-reviews.svg';
import settingsProfile from '@/shared/assets/settings-profile.svg';
import profileExit from '@/shared/assets/profile-exit.svg';

export interface UserData {
  firstName?: string;
  lastName?: string;
  location?: string;
  photoUrl?: string;
  profileProgress?: number;
}

interface SidebarProps {
  user?: UserData | null;
}

export const Sidebar = ({ user }: SidebarProps) => {
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Марина Добра';
  const location = user?.location || 'Київ, Україна';
  const progress = user?.profileProgress || 80;
  const avatarSrc = user?.photoUrl || 'https://ui-avatars.com/api/?name=MD&background=F6FAF8&color=265447';

  return (
    <aside className="flex flex-col w-[235px] shrink-0 py-[24px] px-[16px] border border-[#265447]/[0.08] rounded-[16px] gap-[36px] bg-white shadow-[0_4px_12px_rgba(23,59,51,0.06)] font-inter">
      
      {/* Блок профілю */}
      <div className="flex flex-col w-[202px] gap-[12px] items-start mx-auto">
        <div className="w-[100px] h-[100px] rounded-full overflow-hidden shrink-0 bg-[#F6FAF8]">
          <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col w-[166px] gap-[6px]">
          <h2 className="text-[14px] font-semibold text-[#265447] leading-none truncate">{fullName}</h2>
          <p className="text-[12px] font-normal text-[#265447] leading-none truncate">{location}</p>
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
            <button className="flex items-center w-full h-[44px] px-[12px] gap-[12px] rounded-[10px] bg-transparent border border-transparent text-[#265447] hover:bg-[#EAF7F2] hover:border-[#6FE3C2] transition-all text-left cursor-pointer">
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