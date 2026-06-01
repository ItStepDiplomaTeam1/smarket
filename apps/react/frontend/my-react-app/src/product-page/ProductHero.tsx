import mainMilk from '../assets/milk.svg';
import thumb1 from '../assets/bottle.svg';
import starIcon from '../assets/gold-star.svg';
import staricongreen from '../assets/star.svg';

export function ProductHero() {
    return (
        <section className="w-full pt-8 pb-16">
            <div className="max-w-[1228px] mx-auto px-6 flex flex-col gap-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 min-h-6 font-inter text-[13px] -mb-4">
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Головна</a>
                    <span className="text-[#D1D5DB] text-xs">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Категорії</a>
                    <span className="text-[#D1D5DB] text-xs">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Молочні продукти</a>
                    <span className="text-[#D1D5DB] text-xs">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Молоко</a>
                    <span className="text-[#D1D5DB] text-xs">/</span>
                    <span className="text-[#111827] font-semibold">Молоко Яготинське 2,6%</span>
                </nav>

                {/* Main product content */}
                <div className="flex justify-between items-start gap-10">

                    {/* LEFT PANEL */}
                    <div className="w-[453px] shrink-0 flex flex-col gap-4">
                        {/* Gallery */}
                        <div className="relative w-[453px] h-[453px] rounded-3xl bg-white border border-[rgba(38,84,71,0.08)] flex justify-center items-center">
                            {/* Badges */}
                            <div className="absolute top-[21px] left-[21px] flex flex-col items-start gap-2 z-[2]">
                                <span className="inline-flex items-center gap-1 h-[26px] px-3 rounded-2xl bg-[#FACC14] text-[#173B33] font-inter text-xs font-semibold leading-[18px]">
                                    Акція тільки сьогодні
                                </span>
                                <span className="inline-flex items-center gap-1 h-[26px] px-3 rounded-2xl bg-[#6FE3C2] text-[#173B33] font-inter text-xs font-semibold leading-[18px]">
                                    Новинка
                                </span>
                                <span className="inline-flex items-center gap-1 h-[28px] px-3 rounded-2xl bg-white border border-[#265447] text-[#265447] font-inter text-xs font-semibold leading-[18px]">
                                    <img src={staricongreen} alt="star" className="w-3 h-3" /> Гарні відгуки
                                </span>
                            </div>
                            {/* Main image */}
                            <div className="w-full h-full flex justify-center items-center">
                                <img src={mainMilk} alt="Молоко Яготинське 2,6%" className="w-[222px] h-[297px] object-contain" />
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex flex-row justify-between w-full gap-3">
                            <div className="w-[143px] h-[143px] rounded-2xl bg-[#EAF7F2] border border-[#265447] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-14 h-[79px] object-contain" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-2xl bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-14 h-[79px] object-contain" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-2xl bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-14 h-[79px] object-contain" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="w-[623px] shrink-0 flex flex-col">

                        {/* Info header */}
                        <div className="flex flex-col gap-3 mb-8">
                            <h1 className="m-0 font-manrope text-[26px] font-extralight leading-[31.2px] text-[#173B33]">
                                Молоко Яготинське пастеризоване 2,6% 870г
                            </h1>
                            <span className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279]">870 г</span>
                            <div className="flex items-center gap-2 font-inter">
                                <div className="flex gap-1">
                                    {[0,1,2,3,4].map(i => (
                                        <img key={i} src={starIcon} alt="star" className="w-4 h-4" />
                                    ))}
                                </div>
                                <span className="text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                    <strong className="font-semibold text-[#265447]">4.8</strong> · 128 відгуків
                                </span>
                            </div>
                        </div>

                        {/* Price section */}
                        <div className="flex flex-col items-start gap-2 mb-8">
                            <div className="font-manrope text-[30px] font-extralight leading-[45px] text-[#173B33]">57.99 ₴</div>
                            <div className="font-inter text-[13px] font-medium leading-[19.5px] text-[#6D8279]">
                                Ціна в <strong className="font-bold text-[13px] leading-[19.5px] text-[#173B33]">NOVUS</strong>
                            </div>
                            <div className="px-[10px] py-1 rounded-[6px] bg-[#FFF2F1] font-inter text-[13px] font-semibold leading-[19.5px] text-[#D94841]">
                                Залишилось мало
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center h-11 px-2 rounded-[10px] border border-[rgba(38,84,71,0.16)]">
                                <button className="w-9 h-full bg-none border-none text-[20px] text-[#4B5563] cursor-pointer bg-transparent">-</button>
                                <span className="w-8 text-center font-inter text-base font-semibold text-[#111827]">1</span>
                                <button className="w-9 h-full bg-none border-none text-[20px] text-[#4B5563] cursor-pointer bg-transparent">+</button>
                            </div>
                            <button className="h-11 px-6 rounded-[10px] border-none bg-[#265447] font-inter text-[13px] font-semibold text-white whitespace-nowrap cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[#1A3E2F]">
                                Додати до кошика
                            </button>
                            <button className="h-11 px-6 rounded-[10px] border border-[rgba(38,84,71,0.16)] bg-white font-inter text-[13px] font-semibold text-[#265447] whitespace-nowrap cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[#F9FAFB]">
                                Додати до списку
                            </button>
                        </div>

                        <p className="max-w-[480px] m-0 mb-8 font-inter text-xs leading-[18px] text-[#6D8279]">
                            Ціни можуть відрізнятися залежно від магазину та часу оновлення.
                        </p>

                        {/* Price compare widget */}
                        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-[rgba(38,84,71,0.08)] bg-white">
                            <div className="flex justify-between items-center">
                                <h3 className="m-0 font-manrope text-lg font-extralight leading-[25.2px] text-[#173B33]">Де дешевше?</h3>
                                <span className="px-3 py-1 rounded-3xl bg-[#FACC14] font-inter text-[13px] font-bold leading-[19.5px] text-[#173B33]">
                                    Можна зекономити 3.50 ₴
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* NOVUS row */}
                                <div className="flex justify-between items-center h-[50px] px-4 rounded-[10px] border border-transparent">
                                    <div className="flex items-center gap-3">
                                        <span className="font-inter text-sm font-semibold leading-[21px] text-[#265447]">NOVUS</span>
                                        <span className="font-inter text-xs text-[#6B7280]">Поточна ціна</span>
                                    </div>
                                    <div className="font-manrope text-base font-extralight leading-6 text-[#265447]">57.99 ₴</div>
                                </div>
                                {/* ATB row (active/best) */}
                                <div className="flex justify-between items-center h-[50px] px-4 rounded-[10px] bg-[#EAF7F2] border border-[#6FE3C2]">
                                    <div className="flex items-center gap-3">
                                        <span className="font-inter text-sm font-semibold leading-[21px] text-[#265447]">АТБ</span>
                                        <span className="font-inter text-xs font-semibold leading-[18px] text-[#265447]">Найкраща ціна</span>
                                    </div>
                                    <div className="font-manrope text-base font-extralight leading-6 text-[#265447]">54.49 ₴</div>
                                </div>
                                {/* Silpo row */}
                                <div className="flex justify-between items-center h-[50px] px-4 rounded-[10px] border border-transparent">
                                    <div className="flex items-center gap-3">
                                        <span className="font-inter text-sm font-semibold leading-[21px] text-[#265447]">Сільпо</span>
                                    </div>
                                    <div className="font-manrope text-base font-extralight leading-6 text-[#265447]">61.99 ₴</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}