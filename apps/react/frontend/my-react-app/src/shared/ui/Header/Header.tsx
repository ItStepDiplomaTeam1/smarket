import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import lupa from '@/shared/assets/lupa.svg';
import koshuk from '@/shared/assets/koshuk.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { apiClient } from '@/shared/api/apiClient';
import { ThemeToggle } from '@/shared/components/ThemeToggle'; // Імпортуємо наш тогл
import { useTheme } from '@/shared/context/ThemeContext'; // Імпортуємо хук теми

function getInitials(name?: string, email?: string): string {
    if (name?.trim()) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return '??';
}

function getDisplayName(name?: string, email?: string): string {
    if (name?.trim()) return name.trim().split(' ')[0];
    if (email) return email.split('@')[0];
    return 'Користувач';
}

function stringToHsl(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 38%)`;
}

// Оновлено класи для лінків з урахуванням темної теми
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `no-underline text-sm font-medium transition-colors duration-200 ${
        isActive 
            ? 'text-[#265447] dark:text-[#3CD27D] font-semibold' 
            : 'text-[#173B33] dark:text-[#A4B3AF] hover:text-[#265447] dark:hover:text-white'
    }`;

export function Header() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { theme } = useTheme(); // Якщо знадобиться пряма перевірка в JS

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = getInitials(user?.name, user?.email);
    const displayName = getDisplayName(user?.name, user?.email);
    const avatarColor = stringToHsl(user?.email ?? user?.name ?? 'user');

    const handleLogout = async () => {
        setDropdownOpen(false);
        try {
            await apiClient.post('/api/v1/auth/logout');
        } catch {
            // Clear local state regardless of server response
        }
        logout();
        navigate('/');
    };

    return (
        // Додано темний фон bg-[#0D1513] та темну рамку border-[#1A2E28]
        <header className="w-full bg-white dark:bg-[#0D1513] border-b border-[#E5E7EB] dark:border-[#1A2E28] h-18 sticky top-0 z-50 transition-colors duration-200">
            <div className="max-w-[1230px] mx-auto px-6 h-full flex justify-between items-center">

                <Link to="/" viewTransition className="flex items-center h-full py-0">
                    {/* Фільтр робить логотип повністю білим у темній темі */}
                    <img src={fix_logo} alt="Smarket Logo" className="h-8 w-auto block object-contain dark:brightness-0 dark:invert" />
                </Link>

                <nav className="flex items-center gap-8">
                    <NavLink to="/" viewTransition className={navLinkClass}>Головна</NavLink>
                    <NavLink to="/catalog" viewTransition className={navLinkClass}>Каталог</NavLink>
                    <NavLink to="/shops" viewTransition className={navLinkClass}>Магазини</NavLink>
                    <NavLink to="/cart" viewTransition className={navLinkClass}>Кошик</NavLink>
                </nav>

                <div className="flex items-center gap-6">
                    
                    {/* Наш новий перемикач теми розміщено ліворуч від пошуку */}
                    <ThemeToggle />

                    <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-5 h-5">
                        <img src={lupa} alt="Search" className="w-5 h-5 block dark:invert dark:brightness-200" />
                    </button>

                    {isAuthenticated && user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-[40px] border border-[rgba(38,84,71,0.12)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#14221E] hover:bg-[#F6FAF8] dark:hover:bg-[#1B2E29] hover:border-[#265447] transition-all duration-200 cursor-pointer"
                                aria-label="Профіль"
                            >
                                <span
                                    className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 select-none overflow-hidden"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </span>
                                <span className="text-[13px] font-semibold text-[#173B33] dark:text-white max-w-22.5 truncate leading-none">
                                    {displayName}
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-3.5 h-3.5 text-[#6D8279] dark:text-[#A4B3AF] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    viewBox="0 0 20 20" fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Випадаюче меню профілю */}
                            <div
                                className={`absolute right-0 mt-2.5 w-55 bg-white dark:bg-[#14221E] rounded-2xl border border-[rgba(38,84,71,0.10)] dark:border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(23,59,51,0.14)] overflow-hidden transition-all duration-200 origin-top-right ${
                                    dropdownOpen
                                        ? 'opacity-100 scale-100 pointer-events-auto'
                                        : 'opacity-0 scale-95 pointer-events-none'
                                }`}
                            >
                                <div className="px-4 pt-4 pb-3 border-b border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden"
                                            style={{ backgroundColor: avatarColor }}
                                        >
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                initials
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[#111827] dark:text-white truncate m-0 leading-4.5">
                                                {user?.name || displayName}
                                            </p>
                                            <p className="text-[11px] text-[#6D8279] dark:text-[#A4B3AF] truncate m-0 leading-4">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-2">
                                    <button
                                        onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#173B33] dark:text-[#A4B3AF] hover:bg-[#F6FAF8] dark:hover:bg-[#1B2E29] hover:text-[#265447] dark:hover:text-white transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#6D8279] dark:text-[#A4B3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Профіль
                                    </button>
                                    <button
                                        onClick={() => { setDropdownOpen(false); navigate('/cart'); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#173B33] dark:text-[#A4B3AF] hover:bg-[#F6FAF8] dark:hover:bg-[#1B2E29] hover:text-[#265447] dark:hover:text-white transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#6D8279] dark:text-[#A4B3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                            <line x1="3" y1="6" x2="21" y2="6"/>
                                            <path d="M16 10a4 4 0 0 1-8 0"/>
                                        </svg>
                                        Мої кошики
                                    </button>
                                </div>

                                <div className="py-2 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                            <polyline points="16 17 21 12 16 7"/>
                                            <line x1="21" y1="12" x2="9" y2="12"/>
                                        </svg>
                                        Вийти
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/auth"
                            viewTransition
                            className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-5 h-5 text-[#173B33] dark:text-[#A4B3AF] hover:text-[#265447] dark:hover:text-white transition-colors duration-200"
                            aria-label="Увійти"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Link>
                    )}

                    <button
                        onClick={() => navigate('/cart')}
                        className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-5 h-5 relative"
                    >
                        <img src={koshuk} alt="Basket" className="w-5 h-5 block dark:invert dark:brightness-200" />
                        {/* Тінь навколо цифри підлаштовується під колір хедера */}
                        <span className="absolute -top-1.5 -right-1.5 bg-[#FFC72C] text-[#173B33] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center select-none shadow-[0_0_0_2px_#fff] dark:shadow-[0_0_0_2px_#0D1513]">
                            3
                        </span>
                    </button>
                </div>

            </div>
        </header>
    );
}

export default Header;