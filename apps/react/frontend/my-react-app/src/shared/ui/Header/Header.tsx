import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import lupa from '@/shared/assets/lupa.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { apiClient } from '@/shared/api/apiClient';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

// Виправлено розміри та товщину ліній, щоб ідеально метчились з іншими іконками
const HeartIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

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

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `no-underline text-sm font-medium transition-colors duration-200 block py-2 md:py-0 ${
        isActive 
            ? 'text-[#265447] dark:text-[#3CD27D] font-semibold' 
            : 'text-[#173B33] dark:text-[#A4B3AF] hover:text-[#265447] dark:hover:text-white'
    }`;

export function Header() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        } catch {}
        logout();
        navigate('/');
    };

    return (
        <header className="w-full bg-white dark:bg-[#0D1513] border-b border-[#E5E7EB] dark:border-[#1A2E28] h-18 sticky top-0 z-50 transition-colors duration-200 relative">
            <div className="max-w-[1230px] mx-auto px-4 md:px-6 h-full flex justify-between items-center">

                <Link to="/" viewTransition className="flex items-center h-full py-0 z-10">
                    <img src={fix_logo} alt="Smarket Logo" className="h-7 md:h-8 w-auto block object-contain dark:brightness-0 dark:invert transition-all" />
                </Link>

                <nav className={`absolute md:static top-full left-0 w-full md:w-auto bg-white dark:bg-[#0D1513] md:bg-transparent border-b md:border-none border-[#E5E7EB] dark:border-[#1A2E28] px-4 md:px-0 py-4 md:py-0 flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 transition-all duration-200 ${mobileMenuOpen ? 'flex shadow-lg md:shadow-none' : 'hidden md:flex'}`}>
                    <NavLink to="/" viewTransition className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Головна</NavLink>
                    <NavLink to="/catalog" viewTransition className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Каталог</NavLink>
                    <NavLink to="/shops" viewTransition className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Магазини</NavLink>
                    <NavLink to="/cart" viewTransition className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Кошик</NavLink>
                </nav>

                <div className="flex items-center gap-4 md:gap-6 z-10">
                    <ThemeToggle />

                    {/* 1. ЛУПА: dark:brightness-0 dark:invert робить її ідеально білою незалежно від початкового кольору */}
                    <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-6 h-6 group">
                        <img src={lupa} alt="Search" className="w-6 h-6 block dark:brightness-0 dark:invert transition-transform group-hover:scale-110" />
                    </button>

                    {isAuthenticated && user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-[40px] border border-[rgba(38,84,71,0.12)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#14221E] hover:bg-[#F6FAF8] dark:hover:bg-[#1B2E29] transition-all cursor-pointer"
                            >
                                <span className="w-7 h-7 md:w-8.5 md:h-8.5 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: avatarColor }}>
                                    {user.photoUrl ? <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                                </span>
                                <span className="text-[12px] md:text-[13px] font-semibold text-[#173B33] dark:text-white max-w-[70px] md:max-w-22.5 truncate transition-colors">
                                    {displayName}
                                </span>
                            </button>

                            <div className={`absolute right-0 mt-2.5 w-55 bg-white dark:bg-[#14221E] rounded-2xl border border-[rgba(38,84,71,0.10)] dark:border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(23,59,51,0.14)] dark:shadow-none overflow-hidden transition-all duration-200 origin-top-right ${dropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <div className="px-4 pt-4 pb-3 border-b border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: avatarColor }}>
                                            {user.photoUrl ? <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[#111827] dark:text-white truncate m-0 leading-4.5 transition-colors">{user?.name || displayName}</p>
                                            <p className="text-[11px] text-[#6D8279] dark:text-[#A4B3AF] truncate m-0 leading-4 transition-colors">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="py-2">
                                    <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#173B33] dark:text-[#A4B3AF] hover:bg-[#F6FAF8] dark:hover:bg-[#1A2E25] hover:text-[#265447] dark:hover:text-white transition-colors duration-150 cursor-pointer bg-transparent border-none text-left">Профіль</button>
                                    <button onClick={() => { setDropdownOpen(false); navigate('/cart'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#173B33] dark:text-[#A4B3AF] hover:bg-[#F6FAF8] dark:hover:bg-[#1A2E25] hover:text-[#265447] dark:hover:text-white transition-colors duration-150 cursor-pointer bg-transparent border-none text-left">Мої кошики</button>
                                </div>
                                <div className="py-2 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150 cursor-pointer bg-transparent border-none text-left">Вийти</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 2. ПРОФІЛЬ: Додано dark:text-white
                        <Link to="/auth" className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-4 h-4 text-[#173B33] dark:text-white hover:text-[#265447] dark:hover:text-[#3CD27D] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Link>
                    )}

                    {/* 3. СЕРДЕЧКО: Додано dark:text-white */}
                    <button onClick={() => navigate('')} className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-4 h-4 relative text-[#173B33] dark:text-white hover:text-[#265447] dark:hover:text-[#3CD27D] transition-colors">
                        <HeartIcon />
                    </button>

                    {/* Бургер меню для мобільних */}
                    <button className="md:hidden flex items-center justify-center bg-transparent border-none cursor-pointer text-[#173B33] dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;