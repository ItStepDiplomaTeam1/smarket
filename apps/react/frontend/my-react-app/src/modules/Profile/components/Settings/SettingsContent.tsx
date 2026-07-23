import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchMe, useChangePassword, useChangeEmail } from '@/hooks/api/useAuthApi';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { PASSWORD_RULES, validatePassword } from '@/shared/utils/password';
import osobustidaniLight from '@/shared/assets/osobustidani_light.svg';
import locaionLight from '@/shared/assets/locaion_light.svg';
import saveteLight from '@/shared/assets/savete_light.svg';
const UKRAINIAN_CITIES = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Запоріжжя', 'Кривий Ріг', 
  'Миколаїв', 'Маріуполь', 'Вінниця', 'Херсон', 'Полтава', 'Чернігів', 
  'Черкаси', 'Житомир', 'Суми', 'Хмельницький', 'Чернівці', 'Рівне', 
  'Кропивницький', 'Івано-Франківськ', 'Кременчук', 'Тернопіль', 'Луцьк', 
  'Біла Церква', 'Ужгород', "Кам'янець-Подільський"
];

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
    return error.response.data.detail;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'save' | 'security' | 'logout';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'save', children, className = '', ...props }) => {
  let colorClasses = '';
  if (variant === 'save') {
    colorClasses = 'bg-transparent border-[#6FE3C2] text-[#255848] hover:bg-[#6FE3C2]/5 dark:bg-[#3DAE8B] dark:text-[#111A17] dark:hover:bg-[#3DAE8B]/90 dark:border-transparent';
  } else if (variant === 'security') {
    colorClasses = 'bg-transparent border-[#00B15E] text-[#00B15E] hover:bg-[#00B15E]/5 dark:bg-[#4ADE80] dark:text-[#111A17] dark:hover:bg-[#4ADE80]/90 dark:border-transparent';
  } else if (variant === 'logout') {
    colorClasses = 'bg-transparent border-[#6D8279] text-[#255848] hover:bg-[#6D8279]/5 dark:bg-[#3DAE8B] dark:text-[#111A17] dark:hover:bg-[#3DAE8B]/90 dark:border-transparent';
  }

  return (
    <button
      className={`h-[36px] px-[19px] py-[10px] rounded-[10px] border text-[13px] font-bold font-inter cursor-pointer transition-all flex items-center justify-center whitespace-nowrap active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const BreadcrumbChevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mx-[2px] brightness-50 dark:brightness-100">
    <path d="M4.5 9L7.5 6L4.5 3" stroke="#6D8279" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function SettingsContent() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { data: meData } = useFetchMe();

  // Особисті дані
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+38 000 000 00 00');

  // Локація та магазини
  const [city, setCity] = useState('Київ');
  const [favoriteStore, setFavoriteStore] = useState('Всі магазини');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Безпека — Пароль
  const password = '••••••••';
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Безпека — Зміна email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Стани збереження (для фідбеку користувачу)
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const triggerSave = (message: string) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const handleSaveLocation = async () => {
    if (!user?.email) return;
    try {
      const currentSettings = meData?.settings || {};
      const nextSettings = {
        ...currentSettings,
        city,
        favorite_store: favoriteStore,
      };
      await apiClient.patch('/api/v1/auth/settings', {
        settings: nextSettings,
      });

      updateUser({ settings: nextSettings });
      window.dispatchEvent(new Event('profile-updated'));
      window.dispatchEvent(new Event('profile-updated'));
      triggerSave('Локацію збережено!');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти локацію на сервері'));
    }
  };

  const handleSavePersonal = async () => {
    if (!user?.email) return;
    try {
      const currentSettings = meData?.settings || {};
      const nextSettings = {
        ...currentSettings,
        name,
        phone,
      };
      await apiClient.patch('/api/v1/auth/settings', {
        settings: nextSettings,
      });

      updateUser({ name, settings: nextSettings });
      window.dispatchEvent(new Event('profile-updated'));
      triggerSave('Дані збережено!');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти дані на сервері'));
    }
  };

  const changePasswordMutation = useChangePassword();

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Будь ласка, заповніть усі поля');
      return;
    }
    
    if (!validatePassword(newPassword)) {
      toast.error('Новий пароль не відповідає всім вимогам безпеки.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        old_password: oldPassword,
        new_password: newPassword,
      });

      toast.success('Пароль успішно змінено! Будь ласка, увійдіть знову з новим паролем.');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');

      logout();
      navigate('/login');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Не вдалося змінити пароль'));
    }
  };

  const changeEmailMutation = useChangeEmail();

  const handleEmailChange = async () => {
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail || !emailPassword) {
      toast.error('Будь ласка, заповніть усі поля');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Введіть коректний email');
      return;
    }

    if (trimmedEmail === user?.email?.toLowerCase()) {
      toast.error('Новий email збігається з поточним');
      return;
    }

    try {
      await changeEmailMutation.mutateAsync({
        new_email: trimmedEmail,
        current_password: emailPassword,
      });

      toast.success(
        `Email успішно змінено на ${trimmedEmail}. Будь ласка, увійдіть з новим email.`,
        { duration: 5000 }
      );

      setShowEmailModal(false);
      setNewEmail('');
      setEmailPassword('');

      logout();
      navigate('/login');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Не вдалося змінити email. Спробуйте пізніше.'));
    }
  };

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.name, user?.email]);

  useEffect(() => {
    const userEmail = user?.email;
    if (userEmail) {
      const backendSettings = meData?.settings || {};
      const savedCity = backendSettings.city;
      const savedStore = backendSettings.favorite_store;
      const savedPhone = backendSettings.phone;
      const savedName = backendSettings.name || user?.name;

      setCity(savedCity || 'Київ');
      setFavoriteStore(savedStore || 'Всі магазини');
      setPhone(savedPhone || '+38 000 000 00 00');
      if (savedName) {
        setName(savedName);
      }
    }
  }, [user?.email, meData, user?.name]);

  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px] max-w-[927px]">
      <div className="w-full">
        {/* Хлібні крихти */}
        <div className="flex flex-wrap items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
          <span className="cursor-pointer hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors" onClick={() => navigate('/')}>Головна</span>
          <BreadcrumbChevron />
          <span className="cursor-pointer hover:text-[#173B33] dark:hover:text-[#3DAE8B] transition-colors" onClick={() => navigate('/profile')}>Особистий кабінет</span>
          <BreadcrumbChevron />
          <span className="text-[#265447] dark:text-[#94A3B8] font-semibold">Налаштування</span>
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between mb-[24px] relative">
          <div>
            <h1 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173633] dark:text-white m-0 mb-[4px]">
              Налаштування
            </h1>
            <p className="font-inter text-[12px] text-[#6D8279] dark:text-[#94A3B8] m-0">
              Керуй своїм акаунтом і параметрами сервісу
            </p>
          </div>

          {/* Спливаюче сповіщення про збереження */}
          {saveStatus && (
            <div className="absolute right-0 top-0 bg-[#EAF7F2] dark:bg-[#173B33] border border-[#265447]/10 dark:border-[#265447]/30 text-[#265447] dark:text-[#6FE3C2] font-semibold text-[13px] px-[16px] py-[8px] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-bounce">
              {saveStatus}
            </div>
          )}
        </div>

        {/* Форма налаштувань */}
        <div className="flex flex-col gap-[12px] w-full">

          {/* Блок 1: Особисті дані */}
          <div className="bg-white dark:bg-[#1C2723] border border-[#265447]/8 dark:border-[#265447]/30 rounded-[16px] p-[24px] flex flex-col gap-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-[8px]">
              {/* Світла іконка з файлу */}
              <img src={osobustidaniLight} alt="user icon" className="w-[28px] h-[28px] block dark:hidden shrink-0" />
              {/* Темна інлайнова іконка */}
              <div className="w-[28px] h-[28px] rounded-full bg-[#4ADE80]/10 items-center justify-center text-[#4ADE80] shrink-0 hidden dark:flex">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="font-manrope text-[19px] font-extrabold text-[#173633] dark:text-white leading-[31.2px] m-0">
                Особисті дані
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-[20px] items-end w-full">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-[16px] w-full">
                <div className="flex flex-col gap-[6px] w-full">
                  <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Ім'я</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-[6px] w-full">
                  <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-[#F3F4F6] dark:bg-[#173B33] text-[#6D8279] dark:text-[#94A3B8] font-inter text-[13px] outline-none cursor-not-allowed opacity-75"
                  />
                </div>

                <div className="flex flex-col gap-[6px] w-full">
                  <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Телефон</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
                  />
                </div>
              </div>

              <Button 
                variant="save"
                onClick={handleSavePersonal}
                className="w-full lg:w-[135px] shrink-0"
              >
                Зберегти зміни
              </Button>
            </div>
          </div>

          {/* Блок 2: Локація та магазини */}
          <div className="bg-white dark:bg-[#1C2723] border border-[#265447]/8 dark:border-[#265447]/30 rounded-[16px] p-[24px] flex flex-col gap-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-[8px]">
              {/* Світла іконка з файлу */}
              <img src={locaionLight} alt="location icon" className="w-[28px] h-[28px] block dark:hidden shrink-0" />
              {/* Темна інлайнова іконка */}
              <div className="w-[28px] h-[28px] rounded-full bg-[#4ADE80]/10 items-center justify-center text-[#4ADE80] shrink-0 hidden dark:flex">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="font-manrope text-[19px] font-extrabold text-[#173633] dark:text-white leading-[31.2px] m-0">
                Локація та магазини
              </h3>
            </div>

            <div className="flex flex-col gap-[16px] w-full">
              {/* Ряд 1: Країна та Місто */}
              <div className="flex flex-col lg:flex-row gap-[20px] items-end w-full">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-[16px] w-full">
                  {/* Країна */}
                  <div className="flex flex-col gap-[6px] w-full">
                    <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Країна</label>
                    <input 
                      type="text" 
                      value="Україна" 
                      readOnly
                      disabled
                      className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-[#F3F4F6] dark:bg-[#173B33] text-[#6D8279] dark:text-[#94A3B8] font-inter text-[13px] outline-none cursor-not-allowed opacity-75"
                    />
                  </div>
                  {/* Місто */}
                  <div className="flex flex-col gap-[6px] w-full relative">
                    <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Місто</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setCity(value);
                        if (value.trim().length > 0) {
                          const filtered = UKRAINIAN_CITIES.filter(item => 
                            item.toLowerCase().startsWith(value.toLowerCase())
                          );
                          setSuggestions(filtered);
                          setShowSuggestions(true);
                        } else {
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }
                      }}
                      placeholder="Введіть місто"
                      className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute top-[64px] left-0 w-full bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[10px] max-h-[150px] overflow-y-auto z-[10] shadow-lg m-0 p-0 list-none">
                        {suggestions.map((item) => (
                          <li 
                            key={item} 
                            onClick={() => {
                              setCity(item);
                              setShowSuggestions(false);
                            }}
                            className="px-[12px] py-[8px] text-[13px] text-[#173B33] dark:text-white hover:bg-[#F6FAF8] dark:hover:bg-[#173B33] cursor-pointer text-left"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Spacer Column */}
                  <div className="hidden md:block"></div>
                </div>
                {/* Spacer matching save button width for perfect vertical alignment */}
                <div className="hidden lg:block w-[135px] shrink-0" />
              </div>

              {/* Ряд 2: Улюблені магазини та кнопка збереження */}
              <div className="flex flex-col lg:flex-row gap-[20px] items-end w-full">
                <div className="w-full lg:w-[548px] flex flex-col gap-[6px] relative shrink-0">
                  <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Улюблені магазини</label>
                  <button 
                    onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                    className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-white dark:bg-[#173B33] text-[#173633] dark:text-white font-inter text-[13px] outline-none flex items-center justify-between cursor-pointer"
                  >
                    <span>{favoriteStore}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${showStoreDropdown ? 'rotate-180' : ''}`}>
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showStoreDropdown && (
                    <ul className="absolute top-[64px] left-0 w-full bg-white dark:bg-[#1C2723] border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[10px] max-h-[200px] overflow-y-auto z-[10] shadow-lg m-0 p-0 list-none">
                      {['Всі магазини', 'Novus', 'Сільпо', 'Auchan', 'Metro', 'Varus', 'Fozzy'].map((store) => (
                        <li 
                          key={store} 
                          onClick={() => {
                            setFavoriteStore(store);
                            setShowStoreDropdown(false);
                          }}
                          className="px-[12px] py-[8px] text-[13px] text-[#173B33] dark:text-white hover:bg-[#F6FAF8] dark:hover:bg-[#173B33] cursor-pointer text-left"
                        >
                          {store}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="hidden lg:block flex-grow" />

                <Button 
                  variant="save"
                  onClick={handleSaveLocation}
                  className="w-full lg:w-[135px] shrink-0"
                >
                  Зберегти зміни
                </Button>
              </div>
            </div>
          </div>

          {/* Блок 4: Безпека акаунту */}
          <div className="bg-white dark:bg-[#1C2723] border border-[#265447]/8 dark:border-[#265447]/30 rounded-[16px] p-[24px] flex flex-col gap-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-[8px]">
              {/* Світла іконка з файлу */}
              <img src={saveteLight} alt="security icon" className="w-[28px] h-[28px] block dark:hidden shrink-0" />
              {/* Темна інлайнова іконка */}
              <div className="w-[28px] h-[28px] rounded-full bg-[#4ADE80]/10 items-center justify-center text-[#4ADE80] shrink-0 hidden dark:flex">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-manrope text-[19px] font-extrabold text-[#173633] dark:text-white leading-[31.2px] m-0">
                Безпека акаунту
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-[20px] items-end w-full justify-between">
              {/* Ліва частина: Пароль + Кнопка */}
              <div className="flex flex-col sm:flex-row gap-[16px] items-end w-full lg:w-auto">
                <div className="w-full sm:w-[264px] flex flex-col gap-[6px] shrink-0">
                  <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-left">Пароль</label>
                  <input 
                    type="password" 
                    value={password} 
                    disabled
                    className="h-[36px] w-full border border-[#6D8279]/24 dark:border-[#265447]/30 rounded-[10px] px-[12px] py-[5px] bg-white dark:bg-[#173B33] text-[#173633] dark:text-white font-inter text-[13px] outline-none opacity-80"
                  />
                </div>

                {/* Кнопка Змінити пароль */}
                <Button 
                  variant="security"
                  onClick={() => {
                    const settings = meData?.settings || {};
                    const isOAuth = !!(settings.google_name || settings.google_picture || settings.telegram_id || settings.telegram_username || settings.telegram_first_name);
                    if (isOAuth) {
                      toast.error('Для вашого типу акаунту зміна пароля недоступна');
                      return;
                    }
                    setShowPasswordModal(true);
                  }}
                  className="w-full sm:w-[135px] shrink-0"
                >
                  Змінити пароль
                </Button>
              </div>

              {/* Вертикальний роздільник строго по центру між кнопками */}
              <div className="hidden lg:block w-[1px] h-[61px] bg-[#265447]/8 dark:bg-[#265447]/30 shrink-0 self-end mb-[2px]" />

              {/* Дії з акаунтом */}
              <div className="flex flex-col gap-[6px] w-full lg:w-[135px] shrink-0 items-center">
                <label className="text-[14px] font-normal font-inter text-[#173633] dark:text-white leading-[21.5px] text-center w-full whitespace-nowrap">Дії з акаунтом</label>
                <Button 
                  variant="logout"
                  onClick={handleLogoutClick}
                  className="w-full"
                >
                  Вийти з акаунту
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Модальне вікно: Зміна Email */}
      {showEmailModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEmailModal(false);
              setNewEmail('');
              setEmailPassword('');
            }
          }}
        >
          <div className="w-full max-w-[440px] bg-white dark:bg-[#1C2723] border border-[#265447]/30 rounded-[16px] p-[28px] flex flex-col gap-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-[10px]">
              <div className="w-[32px] h-[32px] rounded-full bg-[#173B33]/8 dark:bg-[#4ADE80]/10 flex items-center justify-center text-[#173B33] dark:text-[#4ADE80] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h4 className="font-manrope text-[18px] font-extrabold text-[#173B33] dark:text-white m-0 leading-tight">
                  Зміна Email
                </h4>
                <p className="font-inter text-[11px] text-[#6D8279] dark:text-[#94A3B8] m-0 mt-[2px]">
                  Після зміни буде потрібна повторна авторизація
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[8px] bg-[#FEF3C7] dark:bg-[#854D0E]/20 border border-[#FDE68A] dark:border-[#854D0E]/40 rounded-[8px] px-[12px] py-[10px]">
              <svg className="shrink-0 mt-[1px] text-[#92400E] dark:text-[#FCD34D]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-inter text-[12px] text-[#92400E] dark:text-[#FCD34D] m-0 leading-[1.5]">
                З міркувань безпеки вам потрібно ввести поточний пароль. Після зміни email вас буде виведено з акаунту.
              </p>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold text-[#6D8279] dark:text-[#94A3B8] uppercase tracking-wide">
                Новий Email
              </label>
              <input
                id="input-new-email"
                type="email"
                placeholder="Введіть новий email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
                className="h-[40px] w-full border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[8px] px-[12px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold text-[#6D8279] dark:text-[#94A3B8] uppercase tracking-wide">
                Поточний Пароль
              </label>
              <input
                id="input-email-current-password"
                type="password"
                placeholder="Введіть поточний пароль"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailChange(); }}
                className="h-[40px] w-full border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[8px] px-[12px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
              />
            </div>

            <div className="flex gap-[12px] justify-end pt-[4px]">
              <button
                id="btn-cancel-email-change"
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                  setEmailPassword('');
                }}
                disabled={changeEmailMutation.isPending}
                className="h-[36px] px-[16px] rounded-[8px] bg-transparent border-none text-[#6D8279] dark:text-[#94A3B8] font-semibold text-[13px] cursor-pointer hover:bg-black/5 disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                id="btn-confirm-email-change"
                onClick={handleEmailChange}
                disabled={changeEmailMutation.isPending || !newEmail.trim() || !emailPassword}
                className="h-[36px] px-[20px] rounded-[8px] bg-[#173B33] dark:bg-[#3DAE8B] border-none text-white dark:text-[#111A17] font-semibold text-[13px] cursor-pointer hover:bg-[#265447] dark:hover:bg-[#3DAE8B]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-[6px]"
              >
                {changeEmailMutation.isPending && (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {changeEmailMutation.isPending ? 'Збереження...' : 'Змінити Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно: Зміна пароля */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white dark:bg-[#1C2723] border border-[#265447]/30 rounded-[16px] p-[24px] flex flex-col gap-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <h4 className="font-manrope text-[18px] font-extrabold text-[#173B33] dark:text-white m-0">
              Зміна пароля
            </h4>
            
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] text-[#6D8279] dark:text-[#94A3B8]">Старий пароль</label>
              <input 
                type="password"
                placeholder="Введіть старий пароль"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="h-[40px] w-full border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[8px] px-[12px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] text-[#6D8279] dark:text-[#94A3B8]">Новий пароль</label>
              <input 
                type="password"
                placeholder="Введіть новий пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordChange(); }}
                className="h-[40px] w-full border border-[#E5E7EB] dark:border-[#265447]/30 rounded-[8px] px-[12px] bg-white dark:bg-[#173B33] text-[#173B33] dark:text-white font-inter text-[13px] outline-none focus:border-[#173B33] dark:focus:border-[#4ADE80] transition-colors"
              />
              {newPassword && (
                <div className="mt-[6px] flex flex-col gap-[2px] mb-[4px]">
                  {PASSWORD_RULES.map((rule, idx) => {
                    const isValid = rule.check(newPassword);
                    return (
                      <div key={idx} className={`flex items-center gap-[6px] text-[11px] font-medium transition-colors duration-300 ${isValid ? 'text-[#265447] dark:text-[#3DAE8B]' : 'text-gray-400 dark:text-[#6D8279]'}`}>
                        {isValid ? (
                          <Check className="w-[12px] h-[12px] shrink-0" strokeWidth={3} />
                        ) : (
                          <div className="w-[12px] h-[12px] shrink-0 rounded-full border border-gray-300 dark:border-[#265447] flex items-center justify-center" />
                        )}
                        <span>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-[12px] justify-end pt-[4px]">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword('');
                  setNewPassword('');
                }}
                className="h-[36px] px-[16px] rounded-[8px] bg-transparent border-none text-[#6D8279] dark:text-[#94A3B8] font-semibold text-[13px] cursor-pointer hover:bg-black/5"
              >
                Скасувати
              </button>
              <button 
                onClick={handlePasswordChange}
                className="h-[36px] px-[20px] rounded-[8px] bg-[#173B33] dark:bg-[#3DAE8B] border-none text-white dark:text-[#111A17] font-semibold text-[13px] cursor-pointer hover:bg-[#265447] dark:hover:bg-[#3DAE8B]/90 transition-colors"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
