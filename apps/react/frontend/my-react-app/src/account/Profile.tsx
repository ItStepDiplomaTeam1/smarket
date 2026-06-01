import logo from '../assets/logo.svg';
import basket from '../assets/basket-profile.svg';
import squere from '../assets/squere.svg';
import location from '../assets/location.svg';
import history from '../assets/history.svg';
import profilelog from '../assets/logo-profile.svg';
import top from '../assets/top.svg';
import arrow from '../assets/arrow-profile.svg';
import lupa from '../assets/lupa-for-profile.svg';
import before from '../assets/before.svg';
import zaglushka from '../assets/iconforprofilebasket.svg';
import barrow_right from '../assets/barrow-right.svg';

export const Profile = () => {
    return (
        <div className="flex min-h-screen bg-[#F6FAF8] font-inter">

            {/* ─── SIDEBAR ─── */}
            <aside className="w-[280px] min-h-screen bg-white border-r border-[rgba(38,84,71,0.08)] flex flex-col shrink-0 pt-6">

                {/* Logo */}
                <a href="/" className="block pl-6 mb-8">
                    <img src={logo} alt="Smarket Logo" className="w-[101.42px] h-7" />
                </a>

                {/* User block */}
                <div className="flex items-center gap-3 mx-6 mb-6 pb-6 border-b border-[rgba(38,84,71,0.08)]">
                    <div className="w-11 h-11 rounded-full bg-[#EAF7F2] text-[#173B33] flex justify-center items-center font-manrope font-bold text-base shrink-0">
                        ОК
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="font-manrope font-bold text-sm leading-[21px] text-[#173B33] truncate">Олена Коваль</div>
                        <div className="font-inter font-normal text-xs leading-[18px] text-[#6D8279] truncate">olena.smarket@gmail.com</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-2 px-4">
                    {/* Active item */}
                    <a href="#" className="relative flex items-center gap-3 px-4 py-3 no-underline rounded-xl font-inter font-semibold text-[15px] leading-[22.5px] text-[#173B33] bg-[#EAF7F2] transition-all duration-200">
                        <img src={before} alt="" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5" />
                        <img src={squere} alt="" className="w-5 h-5 shrink-0" />
                        Огляд
                    </a>
                    <a href="#" className="relative flex items-center gap-3 px-4 py-3 no-underline rounded-xl font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={basket} alt="" className="w-5 h-5 shrink-0 opacity-60" />
                        Мої кошики
                    </a>
                    <a href="#" className="relative flex items-center gap-3 px-4 py-3 no-underline rounded-xl font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={history} alt="" className="w-5 h-5 shrink-0 opacity-60" />
                        Історія покупок
                    </a>
                    <a href="#" className="relative flex items-center gap-3 px-4 py-3 no-underline rounded-xl font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={location} alt="" className="w-5 h-5 shrink-0 opacity-60" />
                        Адреси
                    </a>
                    <a href="#" className="relative flex items-center gap-3 px-4 py-3 no-underline rounded-xl font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={profilelog} alt="" className="w-5 h-5 shrink-0 opacity-60" />
                        Профіль
                    </a>
                </nav>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-1 min-w-0 px-12 py-10 overflow-y-auto">

                {/* Page header */}
                <header className="flex justify-between items-start gap-6 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-manrope font-extrabold text-[28px] leading-[42px] text-[#173B33] m-0">
                            Добрий день, Олено
                        </h1>
                        <p className="font-inter font-normal text-[15px] leading-[22.5px] text-[#6D8279] m-0">
                            Сьогодні можна зекономити на вашому звичному кошику.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Search input */}
                        <div className="flex items-center gap-2 w-[320px] h-11 bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4">
                            <img src={lupa} alt="Search" className="w-[18px] h-[18px] shrink-0" />
                            <input
                                type="text"
                                placeholder="Пошук покупок або товарів"
                                className="border-none outline-none w-full h-full p-0 font-inter text-sm text-[#111827] bg-transparent placeholder:text-[#6D8279]"
                            />
                        </div>
                        {/* Back link */}
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 h-11 px-4 bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] no-underline font-inter font-semibold text-sm text-[#173B33] whitespace-nowrap transition-colors duration-200 hover:bg-[#F9FAFB]"
                        >
                            <img src={arrow} alt="" className="w-4 h-4 shrink-0" />
                            На головну сторінку
                        </a>
                    </div>
                </header>

                {/* ── STAT CARDS ── */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col gap-0">
                        <p className="font-inter text-sm font-semibold text-[#6D8279] mb-4 m-0">Заощаджено цього місяця</p>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-manrope font-extrabold text-[28px] leading-[1.2] text-[#173B33] m-0">1 284 грн</h2>
                            <span className="inline-flex items-center gap-1 bg-[#FEF08A] text-[#854D0E] font-inter text-xs font-bold px-2 py-1 rounded-[6px] shrink-0">
                                <img src={top} alt="" className="w-3 h-3" /> Топ
                            </span>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">на 6 порівняних кошиках</p>
                    </div>

                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <p className="font-inter text-sm font-semibold text-[#6D8279] mb-4 m-0">Активні кошики</p>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-manrope font-extrabold text-[28px] leading-[1.2] text-[#173B33] m-0">3</h2>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">готові до порівняння</p>
                    </div>

                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <p className="font-inter text-sm font-semibold text-[#6D8279] mb-4 m-0">Улюблені магазини</p>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-manrope font-extrabold text-[28px] leading-[1.2] text-[#173B33] m-0">5</h2>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">АТБ, Сільпо, Novus та інші</p>
                    </div>
                </div>

                {/* ── MIDDLE ROW ── */}
                <div className="flex gap-6">

                    {/* Current basket card */}
                    <div className="flex-[2] bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <h3 className="font-manrope text-lg font-bold leading-[27px] text-[#173B33] m-0 mb-6 pb-4 border-b border-dashed border-[rgba(38,84,71,0.16)]">
                            Поточний кошик
                        </h3>

                        <div className="mb-4">
                            <h4 className="font-manrope text-lg font-bold leading-[27px] text-[#173B33] m-0 mb-1">Закупівля на тиждень</h4>
                            <p className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279] m-0">12 товарів - оновлено сьогодні</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {['Молоко','Кава','Олія','Підгузки','Сир','+7 товарів'].map((chip) => (
                                <span key={chip} className="bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[20px] px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-[#265447]">
                                    {chip}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Best price row */}
                            <div className="flex justify-between items-center px-6 py-4 bg-[#EAF7F2] border border-[#6FE3C2] rounded-[10px]">
                                <div className="flex items-center gap-3">
                                    <span className="font-inter font-semibold text-[15px] text-[#173B33]">АТБ</span>
                                    <span className="bg-[#FACC14] text-[#173B33] font-inter font-bold text-xs px-2 py-1 rounded-[6px]">Найкраща ціна</span>
                                </div>
                                <div className="text-right flex flex-col gap-0.5">
                                    <div className="font-manrope font-extrabold text-lg leading-[27px] text-[#173B33]">1 842 грн</div>
                                    <div className="font-inter font-semibold text-xs leading-[18px] text-[#265447]">Економія 426 грн</div>
                                </div>
                            </div>
                            {/* Other rows */}
                            <div className="flex justify-between items-center px-6 py-4 bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[10px]">
                                <span className="font-inter font-semibold text-[15px] text-[#173B33]">Сільпо</span>
                                <div className="font-manrope font-extrabold text-lg leading-[27px] text-[#173B33]">1 976 грн</div>
                            </div>
                            <div className="flex justify-between items-center px-6 py-4 bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[10px]">
                                <span className="font-inter font-semibold text-[15px] text-[#173B33]">Novus</span>
                                <div className="font-manrope font-extrabold text-lg leading-[27px] text-[#173B33]">2 031 грн</div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button className="flex-1 h-11 bg-[#265447] text-white border-none rounded-[10px] font-inter font-semibold text-sm cursor-pointer transition-colors duration-200 hover:bg-[#1A3E2F]">
                                Порівняти магазини
                            </button>
                            <button className="flex-1 h-11 bg-white text-[#265447] border border-[rgba(38,84,71,0.16)] rounded-[10px] font-inter font-semibold text-sm cursor-pointer transition-colors duration-200 hover:bg-[#F9FAFB]">
                                Редагувати кошик
                            </button>
                        </div>
                    </div>

                    {/* Recent purchases card */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <h3 className="font-manrope text-lg font-bold leading-[27px] text-[#173B33] m-0 mb-6">
                            Останні покупки
                        </h3>
                        <div className="flex flex-col">
                            {[0,1,2].map((i) => (
                                <div key={i} className={`flex items-start py-4 gap-4 ${i < 2 ? 'border-b border-[rgba(38,84,71,0.08)]' : ''}`}>
                                    <img src={zaglushka} alt="" className="w-10 h-10 shrink-0" />
                                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                                        <div className="font-manrope font-bold text-[15px] leading-[22.5px] text-[#173B33]">Закупівля на тиждень</div>
                                        <div className="font-inter font-semibold text-[13px] leading-[19.5px] text-[#173B33]">
                                            АТБ · <span className="font-inter font-normal text-xs leading-[18px] text-[#6D8279]">1 842 грн · Економія 426 грн</span>
                                        </div>
                                        <div className="font-inter font-normal text-xs leading-[18px] text-[#6D8279]">07 червня 2026</div>
                                    </div>
                                    <a href="#" className="flex items-center gap-1 font-inter font-semibold text-[13px] text-[#265447] no-underline shrink-0 mt-0.5 hover:underline">
                                        Деталі
                                        <img src={barrow_right} alt="" className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM ROW ── */}
                <div className="flex gap-6 mt-6">

                    {/* Address card */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col min-h-[275px]">
                        <h3 className="font-manrope text-lg font-bold leading-[27px] text-[#173B33] m-0 mb-6">
                            Основна адреса
                        </h3>
                        <div className="flex flex-col flex-1">
                            <p className="font-inter font-semibold text-[15px] text-[#111827] m-0 mb-1">Київ, вул. Січових Стрільців, 24</p>
                            <p className="font-inter font-normal text-[13px] text-[#6D8279] m-0 mb-6">Використовується для пошуку магазинів поруч.</p>
                            <div className="mt-auto pt-6 border-t border-[rgba(38,84,71,0.16)]">
                                <a href="#" className="inline-flex items-center gap-1 font-inter font-semibold text-[13px] text-[#265447] no-underline hover:underline">
                                    Змінити адресу
                                    <img src={barrow_right} alt="" className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Profile info card */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-3xl p-6 shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col min-h-[275px]">
                        <h3 className="font-manrope text-lg font-bold leading-[27px] text-[#173B33] m-0 mb-6">
                            Профіль
                        </h3>
                        <div className="flex flex-col flex-1">
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-col gap-1">
                                    <span className="font-inter font-normal text-xs text-[#6D8279]">Ім'я</span>
                                    <span className="font-inter font-semibold text-sm text-[#173B33]">Олена Коваль</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-inter font-normal text-xs text-[#6D8279]">Email</span>
                                    <span className="font-inter font-semibold text-sm text-[#173B33]">olena.smarket@gmail.com</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-inter font-normal text-xs text-[#6D8279]">Мова</span>
                                    <span className="font-inter font-semibold text-sm text-[#173B33]">Українська</span>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 border-t border-[rgba(38,84,71,0.16)]">
                                <a href="#" className="inline-flex items-center gap-1 font-inter font-semibold text-[13px] text-[#265447] no-underline hover:underline">
                                    Редагувати профіль
                                    <img src={barrow_right} alt="" className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};