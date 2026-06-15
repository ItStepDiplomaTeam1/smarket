import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import lupa from '@/shared/assets/lupa.svg';
import koshuk from '@/shared/assets/koshuk.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';
import { useAuthStore } from '@/modules/Auth/store/authStore';

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
    `no-underline text-sm font-medium transition-colors duration-200 ${
        isActive ? 'text-[#265447] font-semibold' : 'text-[#173B33] hover:text-[#265447]'
    }`;

export interface HeaderProps {
    readonly onNavigate?: (page: string) => void;
}

export function Header() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

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

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
        navigate('/');
    };

    return (
        <header className="w-full bg-white border-b border-[#E5E7EB] h-[72px] sticky top-0 z-50">
            <div className="max-w-[1228px] mx-auto px-6 h-full flex justify-between items-center">

                <Link to="/" className="flex items-center h-full py-0">
                    <img src={fix_logo} alt="Smarket Logo" className="h-8 w-auto block object-contain" />
                </Link>

                <nav className="flex items-center gap-8">
                    <NavLink to="/catalog" className={navLinkClass}>Каталог</NavLink>
                    <NavLink to="/catalog" className={navLinkClass}>Порівняти ціни</NavLink>
                    <NavLink to="/catalog" className={navLinkClass}>Магазини</NavLink>
                </nav>

                <div className="flex items-center gap-5">
                    <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-5 h-5">
                        <img src={lupa} alt="Search" className="w-5 h-5 block" />
                    </button>

                    <button
                        onClick={() => navigate('/catalog')}
                        className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-5 h-5"
                    >
                        <img src={koshuk} alt="Basket" className="w-5 h-5 block" />
                    </button>

                    {isAuthenticated && user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-[10px] pl-[4px] pr-[10px] py-[4px] rounded-[40px] border border-[rgba(38,84,71,0.12)] bg-white hover:bg-[#F6FAF8] hover:border-[#265447] transition-all duration-200 cursor-pointer"
                                aria-label="Профіль"
                            >
                                <span
                                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 select-none"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {initials}
                                </span>
                                <span className="text-[13px] font-semibold text-[#173B33] max-w-[90px] truncate leading-none">
                                    {displayName}
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-[14px] h-[14px] text-[#6D8279] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    viewBox="0 0 20 20" fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div
                                className={`absolute right-0 mt-[10px] w-[220px] bg-white rounded-[16px] border border-[rgba(38,84,71,0.10)] shadow-[0_8px_32px_rgba(23,59,51,0.14)] overflow-hidden transition-all duration-200 origin-top-right ${
                                    dropdownOpen
                                        ? 'opacity-100 scale-100 pointer-events-auto'
                                        : 'opacity-0 scale-95 pointer-events-none'
                                }`}
                            >
                                {/* User info block */}
                                <div className="px-[16px] pt-[16px] pb-[12px] border-b border-[rgba(38,84,71,0.08)]">
                                    <div className="flex items-center gap-[12px]">
                                        <span
                                            className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                                            style={{ backgroundColor: avatarColor }}
                                        >
                                            {initials}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[#111827] truncate m-0 leading-[18px]">
                                                {user?.name || displayName}
                                            </p>
                                            <p className="text-[11px] text-[#6D8279] truncate m-0 leading-[16px]">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="py-[8px]">
                                    <button
                                        onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                                        className="w-full flex items-center gap-[10px] px-[16px] py-[10px] text-[13px] font-medium text-[#173B33] hover:bg-[#F6FAF8] hover:text-[#265447] transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] shrink-0 text-[#6D8279]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Профіль
                                    </button>
                                    <button
                                        onClick={() => { setDropdownOpen(false); navigate('/cart'); }}
                                        className="w-full flex items-center gap-[10px] px-[16px] py-[10px] text-[13px] font-medium text-[#173B33] hover:bg-[#F6FAF8] hover:text-[#265447] transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] shrink-0 text-[#6D8279]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                            <line x1="3" y1="6" x2="21" y2="6"/>
                                            <path d="M16 10a4 4 0 0 1-8 0"/>
                                        </svg>
                                        Мої кошики
                                    </button>
                                </div>

                                {/* Logout */}
                                <div className="py-[8px] border-t border-[rgba(38,84,71,0.08)]">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-[10px] px-[16px] py-[10px] text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer bg-transparent border-none text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <a
                            href="/auth"
                            className="flex items-center gap-[6px] h-[36px] px-[16px] rounded-[10px] bg-[#265447] text-white text-[13px] font-semibold no-underline transition-all duration-200 hover:bg-[#1A3E2F] hover:shadow-[0_4px_12px_rgba(38,84,71,0.25)] active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Увійти
                        </a>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Header;
