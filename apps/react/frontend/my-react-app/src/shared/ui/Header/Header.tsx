import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import lupa from '@/shared/assets/lupa.svg';
import fix_logo from '@/shared/assets/Logo-Smarket.svg';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { apiClient } from '@/shared/api/apiClient';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { useQuery } from '@tanstack/react-query';
import { type ReceiptListItem } from '@/hooks/api/useCartApi';
import { ReceiptsDropdown } from './ReceiptsDropdown';
import { HeaderSearch } from '@/shared/ui/Header/HeaderSearch';
import { ReceiptText, MapPin } from 'lucide-react';
import { useLocationStore } from '@/shared/store/locationStore';
import { CitySelectorModal } from './CitySelectorModal';

// ================= ICONS =================
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14H6L5 6"></path>
    <path d="M10 11v6M14 11v6"></path>
    <path d="M9 6V4h6v2"></path>
  </svg>
);

// ================= HELPERS =================
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

// ================= COMPONENT =================
export function Header() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    const [receiptsOpen, setReceiptsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cityModalOpen, setCityModalOpen] = useState(false);

    const currentCity = useLocationStore((state) => state.currentCity);
    const isCityFilterEnabled = useLocationStore((state) => state.isCityFilterEnabled);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const favoritesRef = useRef<HTMLDivElement>(null);
    const receiptsRef = useRef<HTMLDivElement>(null);

    // Favorites store
    const { items: favorites, isLoaded, load: loadFavorites, remove: removeFavorite } = useFavoritesStore();

    // Fetch receipts list for count badge
    const { data: receipts } = useQuery<ReceiptListItem[]>({
        queryKey: ['my-receipts'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/v1/cart/receipts');
            return data;
        },
        enabled: isAuthenticated,
    });

    // Load favorites when user is authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoaded) {
            loadFavorites();
        }
    }, [isAuthenticated, isLoaded, loadFavorites]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
            if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) {
                setFavoritesOpen(false);
            }
            if (receiptsRef.current && !receiptsRef.current.contains(e.target as Node)) {
                setReceiptsOpen(false);
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
        useFavoritesStore.getState().reset();
        navigate('/');
    };

    const displayedFavorites = favorites.slice(0, 10);

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

                <div className="flex items-center gap-3 md:gap-4 z-10">
                    <button
                        type="button"
                        onClick={() => setCityModalOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EEF5F1] dark:bg-[#1C2C26] text-[#265447] dark:text-[#3DAE8B] hover:bg-[#E2ECE7] dark:hover:bg-[#243A32] font-semibold text-xs md:text-sm transition-all cursor-pointer border border-[rgba(38,84,71,0.12)] dark:border-[rgba(61,174,139,0.2)] shadow-xs"
                        title={isCityFilterEnabled ? 'Змінити місто' : 'Увімкнути фільтр за містом'}
                    >
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#265447] dark:text-[#3DAE8B] shrink-0" />
                        <span className="max-w-[70px] md:max-w-[100px] truncate">
                            {isCityFilterEnabled ? currentCity : 'Усі міста'}
                        </span>
                    </button>

                    <ThemeToggle />

                    {/* ЛУПА */}
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-8 h-8 group"
                        aria-label="Відкрити пошук"
                    >
                        <img src={lupa} alt="Search" className="w-7 h-7 block dark:brightness-0 dark:invert transition-transform group-hover:scale-110" />
                    </button>

                    {/* ПРОФІЛЬ */}
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
                        <Link to="/auth" className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 w-4 h-4 text-[#173B33] dark:text-white hover:text-[#265447] dark:hover:text-[#3CD27D] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Link>
                    )}

                    {/* ================= СЕРДЕЧКО / FAVORITES DROPDOWN ================= */}
                    <div className="relative" ref={favoritesRef}>
                        <button
                            id="favorites-toggle-btn"
                            onClick={() => {
                                if (!isAuthenticated) { navigate('/auth'); return; }
                                setFavoritesOpen((v) => !v);
                            }}
                            className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 relative text-[#173B33] dark:text-white hover:text-[#E11D48] dark:hover:text-[#F43F5E] transition-colors"
                        >
                            <HeartIcon filled={favorites.length > 0} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-[#E11D48] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                                    {favorites.length > 9 ? '9+' : favorites.length}
                                </span>
                            )}
                        </button>

                        {/* Favorites Dropdown */}
                        <div className={`absolute right-0 mt-3 w-[320px] bg-white dark:bg-[#14221E] rounded-2xl border border-[rgba(38,84,71,0.10)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(23,59,51,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-200 origin-top-right ${favoritesOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#E11D48]"><HeartIcon filled /></span>
                                    <span className="text-[14px] font-bold text-[#111827] dark:text-white">Улюблені</span>
                                    {favorites.length > 0 && (
                                        <span className="text-[11px] font-semibold text-[#6D8279] dark:text-[#7A8D85]">({favorites.length})</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {displayedFavorites.length === 0 ? (
                                <div className="py-8 px-4 text-center">
                                    <div className="text-[#D1D5DB] dark:text-[#2B4236] mb-3">
                                        <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </div>
                                    <p className="text-[13px] text-[#9CA3AF] dark:text-[#7A8D85] m-0">Список улюблених порожній</p>
                                    <p className="text-[12px] text-[#C0CCC7] dark:text-[#4A5D54] m-0 mt-1">Натисніть ♡ на товарі, щоб зберегти</p>
                                </div>
                            ) : (
                                <ul className="py-1 max-h-[360px] overflow-y-auto">
                                    {displayedFavorites.map((item) => (
                                        <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F6FAF8] dark:hover:bg-[#1A2E25] transition-colors group">
                                            {/* Thumbnail */}
                                            <div
                                                className="w-10 h-10 rounded-[8px] bg-[#F3F4F6] dark:bg-[#1A2E25] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                                onClick={() => { setFavoritesOpen(false); navigate(`/product/${item.product_id}`); }}
                                            >
                                                {item.product_image_url ? (
                                                    <img src={item.product_image_url} alt={item.product_title ?? ''} className="w-full h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                                                ) : (
                                                    <svg className="w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => { setFavoritesOpen(false); navigate(`/product/${item.product_id}`); }}
                                            >
                                                <p className="text-[13px] font-medium text-[#111827] dark:text-white m-0 line-clamp-1 leading-snug">
                                                    {item.product_title ?? `Товар #${item.product_id}`}
                                                </p>
                                                {item.product_price !== null && (
                                                    <p className="text-[12px] font-bold text-[#265447] dark:text-[#3CD27D] m-0 mt-0.5">
                                                        від {item.product_price} ₴
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFavorite(item.product_id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-950/30 text-[#9CA3AF] hover:text-[#E11D48] transition-all cursor-pointer bg-transparent border-none shrink-0"
                                                title="Видалити з улюблених"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {favorites.length > 10 && (
                                <div className="px-4 py-2 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)] text-center">
                                    <span className="text-[12px] text-[#9CA3AF] dark:text-[#7A8D85]">
                                        Показано 10 з {favorites.length} товарів
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ================= ЧЕКИ / RECEIPTS DROPDOWN ================= */}
                    {isAuthenticated && (
                        <div className="relative" ref={receiptsRef}>
                            <button
                                id="receipts-toggle-btn"
                                onClick={() => {
                                    setReceiptsOpen((v) => !v);
                                }}
                                className="bg-transparent border-none cursor-pointer flex items-center justify-center p-0 relative text-[#173B33] dark:text-white hover:text-[#265447] dark:hover:text-[#3DAE8B] transition-colors"
                                title="Мої чеки"
                            >
                                <ReceiptText className="w-4.5 h-4.5" />
                                {receipts && receipts.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                                        {receipts.length > 9 ? '9+' : receipts.length}
                                    </span>
                                )}
                            </button>

                            <ReceiptsDropdown 
                                isOpen={receiptsOpen} 
                                onClose={() => setReceiptsOpen(false)} 
                            />
                        </div>
                    )}

                    {/* Бургер меню для мобільних */}
                    <button className="md:hidden flex items-center justify-center bg-transparent border-none cursor-pointer text-[#173B33] dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/></svg>
                    </button>
                </div>
            </div>
            <HeaderSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <CitySelectorModal isOpen={cityModalOpen} onClose={() => setCityModalOpen(false)} />
        </header>
    );
}

export default Header;
