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

            {/* ─── САЙДБАР ─── */}
            <aside className="w-[280px] min-h-screen bg-white border-r border-[rgba(38,84,71,0.08)] flex flex-col shrink-0 pt-[24px]">

                {/* Логотип */}
                <a href="/" className="block pl-[24px] mb-[32px]">
                    <img src={logo} alt="Smarket Logo" className="w-[101.42px] h-[28px]" />
                </a>

                {/* Блок користувача */}
                <div className="flex items-center gap-[12px] mx-[24px] mb-[24px] pb-[24px] border-b border-[rgba(38,84,71,0.08)]">
                    <div className="w-[44px] h-[44px] rounded-[22px] bg-[#EAF7F2] text-[#173B33] flex justify-center items-center font-manrope font-bold text-[16px] shrink-0">
                        ОК
                    </div>
                    <div className="flex flex-col gap-[2px] min-w-0">
                        <div className="font-manrope font-bold text-[14px] leading-[21px] text-[#173B33] truncate">Олена Коваль</div>
                        <div className="font-inter font-normal text-[12px] leading-[18px] text-[#6D8279] truncate">olena.smarket@gmail.com</div>
                    </div>
                </div>

                {/* Навігація */}
                <nav className="flex flex-col gap-[8px] px-[16px]">
                    <a href="#" className="group relative flex items-center gap-[12px] px-[16px] py-[12px] no-underline rounded-[12px] font-inter font-semibold text-[15px] leading-[22.5px] text-[#173B33] bg-[#EAF7F2] transition-all duration-200">
                        <img src={before} alt="" className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[20px]" />
                        <img src={squere} alt="" className="w-[20px] h-[20px] shrink-0 opacity-100" />
                        Огляд
                    </a>
                    <a href="#" className="group relative flex items-center gap-[12px] px-[16px] py-[12px] no-underline rounded-[12px] font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={basket} alt="" className="w-[20px] h-[20px] shrink-0 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
                        Мої кошики
                    </a>
                    <a href="#" className="group relative flex items-center gap-[12px] px-[16px] py-[12px] no-underline rounded-[12px] font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={history} alt="" className="w-[20px] h-[20px] shrink-0 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
                        Історія покупок
                    </a>
                    <a href="#" className="group relative flex items-center gap-[12px] px-[16px] py-[12px] no-underline rounded-[12px] font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={location} alt="" className="w-[20px] h-[20px] shrink-0 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
                        Адреси
                    </a>
                    <a href="#" className="group relative flex items-center gap-[12px] px-[16px] py-[12px] no-underline rounded-[12px] font-inter font-medium text-[15px] leading-[22.5px] text-[#6D8279] transition-all duration-200 hover:bg-[#F9FAFB] hover:text-[#173B33]">
                        <img src={profilelog} alt="" className="w-[20px] h-[20px] shrink-0 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
                        Профіль
                    </a>
                </nav>
            </aside>

            {/* ─── ОСНОВНИЙ КОНТЕНТ ─── */}
            <main className="flex-1 min-w-0 px-[48px] py-[40px] overflow-y-auto">

                {/* Шапка сторінки */}
                <header className="flex justify-between items-start mb-[32px]">
                    <div className="flex flex-col gap-[4px]">
                        <h1 className="font-manrope font-extrabold text-[28px] leading-[42px] text-[#173B33] m-0 mb-[4px]">
                            Добрий день, Олено
                        </h1>
                        <p className="font-inter font-normal text-[15px] leading-[22.5px] text-[#6D8279] m-0">
                            Сьогодні можна зекономити на вашому звичному кошику.
                        </p>
                    </div>
                    <div className="flex items-center gap-[16px] shrink-0">
                        {/* Пошук */}
                        <div className="flex items-center gap-[8px] w-[320px] h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px]">
                            <img src={lupa} alt="Search" className="w-[18px] h-[18px] shrink-0" />
                            <input
                                type="text"
                                placeholder="Пошук покупок або товарів"
                                className="border-none outline-none w-full h-full p-0 m-0 font-inter text-[14px] leading-[100%] text-[#111827] bg-transparent placeholder:text-[#6D8279] placeholder:opacity-100"
                            />
                        </div>
                        {/* Кнопка назад */}
                        <a
                            href="/"
                            className="flex items-center justify-center gap-[8px] h-[44px] px-[16px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] no-underline font-inter font-semibold text-[14px] text-[#173B33] transition-colors duration-200 hover:bg-[#F9FAFB]"
                        >
                            <img src={arrow} alt="" className="w-[16px] h-[16px] shrink-0" />
                            На головну сторінку
                        </a>
                    </div>
                </header>

                {/* ── СІТКА КАРТОК (ВЕРХНІ 3) ── */}
                <div className="flex gap-[24px] mb-[24px]">
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <p className="font-inter text-[14px] font-semibold text-[#6D8279] mb-[16px] m-0">Заощаджено цього місяця</p>
                        <div className="flex items-center gap-[12px] mb-[8px]">
                            <h2 className="font-manrope font-extrabold text-[28px] text-[#173B33] m-0">1 284 грн</h2>
                            <span className="flex items-center gap-[4px] bg-[#FACC14] text-[#173B33] font-inter text-[12px] font-bold px-[8px] py-[4px] rounded-[6px] shrink-0">
                                <img src={top} alt="" className="w-[12px] h-[12px]" /> Топ
                            </span>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">на 6 порівняних кошиках</p>
                    </div>

                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <p className="font-inter text-[14px] font-semibold text-[#6D8279] mb-[16px] m-0">Активні кошики</p>
                        <div className="flex items-center gap-[12px] mb-[8px]">
                            <h2 className="font-manrope font-extrabold text-[28px] text-[#173B33] m-0">3</h2>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">готові до порівняння</p>
                    </div>

                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <p className="font-inter text-[14px] font-semibold text-[#6D8279] mb-[16px] m-0">Улюблені магазини</p>
                        <div className="flex items-center gap-[12px] mb-[8px]">
                            <h2 className="font-manrope font-extrabold text-[28px] text-[#173B33] m-0">5</h2>
                        </div>
                        <p className="font-inter text-[13px] text-[#9CA3AF] m-0">АТБ, Сільпо, Novus та інші</p>
                    </div>
                </div>

                {/* ── СЕРЕДНІЙ РЯД ── */}
                <div className="flex gap-[24px]">

                    {/* Картка Поточного кошика */}
                    <div className="flex-[2] bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col min-h-[350px]">
                        <h3 className="font-manrope text-[18px] font-bold leading-[27px] text-[#173B33] m-0 mb-[24px] pb-[16px] border-b border-dashed border-[rgba(38,84,71,0.16)]">
                            Поточний кошик
                        </h3>

                        <div className="mb-[16px]">
                            <h4 className="font-manrope text-[18px] font-bold leading-[27px] text-[#173B33] m-0 mb-[4px]">Закупівля на тиждень</h4>
                            <p className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279] m-0">12 товарів - оновлено сьогодні</p>
                        </div>

                        <div className="flex flex-wrap gap-[8px] mb-[24px]">
                            {['Молоко','Кава','Олія','Підгузки','Сир','+7 товарів'].map((chip) => (
                                <span key={chip} className="bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[20px] px-[12px] py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-[#265447]">
                                    {chip}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-col gap-[12px]">
                            <div className="flex justify-between items-center px-[24px] py-[16px] bg-[#EAF7F2] border border-[#6FE3C2] rounded-[10px]">
                                <div className="flex items-center gap-[12px]">
                                    <span className="font-inter font-semibold text-[15px] text-[#173B33]">АТБ</span>
                                    <span className="bg-[#FACC14] text-[#173B33] font-inter font-bold text-[12px] px-[8px] py-[4px] rounded-[6px]">Найкраща ціна</span>
                                </div>
                                <div className="text-right flex flex-col gap-[2px]">
                                    <div className="font-manrope font-extrabold text-[18px] leading-[27px] text-[#173B33]">1 842 грн</div>
                                    <div className="font-inter font-semibold text-[12px] leading-[18px] text-[#265447]">Економія 426 грн</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-[24px] py-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[10px]">
                                <span className="font-inter font-semibold text-[15px] text-[#173B33]">Сільпо</span>
                                <div className="font-manrope font-extrabold text-[18px] leading-[27px] text-[#173B33]">1 976 грн</div>
                            </div>
                            <div className="flex justify-between items-center px-[24px] py-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] rounded-[10px]">
                                <span className="font-inter font-semibold text-[15px] text-[#173B33]">Novus</span>
                                <div className="font-manrope font-extrabold text-[18px] leading-[27px] text-[#173B33]">2 031 грн</div>
                            </div>
                        </div>

                        <div className="flex gap-[16px] mt-[32px]">
                            <button className="flex-1 h-[44px] bg-[#265447] text-white border-none rounded-[10px] font-inter font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#1A3E2F]">
                                Порівняти магазини
                            </button>
                            <button className="flex-1 h-[44px] bg-white text-[#265447] border border-[rgba(38,84,71,0.16)] rounded-[10px] font-inter font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#F9FAFB]">
                                Редагувати кошик
                            </button>
                        </div>
                    </div>

                    {/* Картка Останні покупки */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <h3 className="font-manrope text-[18px] font-bold leading-[27px] text-[#173B33] m-0 mb-[24px] pb-[16px] border-b border-dashed border-[rgba(38,84,71,0.16)]">
                            Останні покупки
                        </h3>
                        <div className="flex flex-col">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={`flex items-start py-[16px] gap-[16px] ${i < 2 ? 'border-b border-[rgba(38,84,71,0.08)]' : ''}`}>
                                    <img src={zaglushka} alt="" className="w-[40px] h-[40px] shrink-0" />
                                    <div className="flex-1 flex flex-col gap-[4px] min-w-0">
                                        <div className="font-manrope font-bold text-[15px] leading-[22.5px] text-[#173B33]">Закупівля на тиждень</div>
                                        <div className="font-inter font-semibold text-[13px] leading-[19.5px] text-[#173B33]">
                                            АТБ · <span className="font-inter font-normal text-[12px] leading-[18px] text-[#6D8279]">1 842 грн · Економія 426 грн</span>
                                        </div>
                                        <div className="font-inter font-normal text-[12px] leading-[18px] text-[#6D8279]">07 червня 2026</div>
                                    </div>
                                    <a href="#" className="flex items-center gap-[4px] font-inter font-semibold text-[13px] text-[#265447] no-underline shrink-0 mt-[2px] hover:underline">
                                        Деталі
                                        <img src={barrow_right} alt="" className="w-[12px] h-[12px]" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── НИЖНІЙ РЯД (Ідеальне позиціонування по Фігмі) ── */}
                <div className="flex gap-[24px] mt-[24px]">

                    {/* Картка Адреси */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <h3 className="font-manrope text-[18px] font-bold leading-[27px] text-[#173B33] m-0 mb-[24px]">
                            Основна адреса
                        </h3>
                        <div className="flex flex-col flex-1">
                            <p className="font-inter font-semibold text-[15px] text-[#173B33] m-0 mb-[4px]">Київ, вул. Січових Стрільців, 24</p>
                            <p className="font-inter font-normal text-[13px] text-[#6D8279] m-0 mb-[24px]">Використовується для пошуку магазинів поруч.</p>
                            
                            <div className="pt-[24px] border-t border-[rgba(38,84,71,0.08)]">
                                <a href="#" className="inline-flex items-center gap-[6px] font-inter font-semibold text-[14px] text-[#173B33] no-underline hover:underline">
                                    Змінити адресу <span className="text-[16px] leading-none mb-[2px]">→</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Картка Профілю */}
                    <div className="flex-1 bg-white border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[24px] shadow-[0px_12px_32px_rgba(23,59,51,0.04)] flex flex-col">
                        <h3 className="font-manrope text-[18px] font-bold leading-[27px] text-[#173B33] m-0 mb-[24px]">
                            Профіль
                        </h3>
                        <div className="flex flex-col flex-1">
                            
                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[24px] mb-[24px]">
                                <div className="col-span-2 flex flex-col gap-[4px]">
                                    <span className="font-inter font-normal text-[12px] text-[#6D8279]">Ім'я</span>
                                    <span className="font-inter font-semibold text-[14px] text-[#173B33]">Олена Коваль</span>
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <span className="font-inter font-normal text-[12px] text-[#6D8279]">Email</span>
                                    <span className="font-inter font-semibold text-[14px] text-[#173B33]">olena.smarket@gmail.com</span>
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <span className="font-inter font-normal text-[12px] text-[#6D8279]">Мова</span>
                                    <span className="font-inter font-semibold text-[14px] text-[#173B33]">Українська</span>
                                </div>
                            </div>

                            <div className="pt-[24px] border-t border-[rgba(38,84,71,0.08)]">
                                <a href="#" className="inline-flex items-center gap-[6px] font-inter font-semibold text-[14px] text-[#173B33] no-underline hover:underline">
                                    Редагувати профіль <span className="text-[16px] leading-none mb-[2px]">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};