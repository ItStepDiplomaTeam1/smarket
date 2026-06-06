import mainMilk from '../../../shared/assets/milk.svg';
import thumb1 from '../../../shared/assets/bottle.svg';
import starIcon from '../../../shared/assets/gold-star.svg';
import staricongreen from '../../../shared/assets/star.svg';

export function ProductHero() {
    return (
        <section className="w-full bg-[#F6FAF8] font-inter pt-[32px] pb-[32px]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px] flex flex-col gap-[32px]">

                {/* Хлібні крихти */}
                <nav className="flex items-center gap-[8px] min-h-[24px] text-[13px] -mb-[16px]">
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Головна</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Категорії</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Молочні продукти</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <a href="#" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Молоко</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <span className="text-[#111827] font-semibold">Молоко Яготинське 2,6%</span>
                </nav>

                {/* Основний контент товару */}
                <div className="flex justify-between items-start gap-[40px]">

                    {/* ЛІВА ПАНЕЛЬ */}
                    <div className="w-[453px] shrink-0 flex flex-col gap-[16px]">
                        {/* Галерея */}
                        <div className="relative w-[453px] h-[453px] rounded-[24px] bg-white border border-[rgba(38,84,71,0.08)] flex justify-center items-center">
                            {/* Бейджі */}
                            <div className="absolute top-[21px] left-[21px] flex flex-col items-start gap-[8px] z-[2]">
                                <span className="inline-flex items-center gap-[4px] h-[26px] px-[12px] rounded-[16px] bg-[#FACC14] text-[#173B33] font-inter text-[12px] font-semibold leading-[18px]">
                                    Акція тільки сьогодні
                                </span>
                                <span className="inline-flex items-center gap-[4px] h-[26px] px-[12px] rounded-[16px] bg-[#6FE3C2] text-[#173B33] font-inter text-[12px] font-semibold leading-[18px]">
                                    Новинка
                                </span>
                                <span className="inline-flex items-center gap-[4px] h-[28px] px-[12px] rounded-[16px] bg-white border border-[#265447] text-[#265447] font-inter text-[12px] font-semibold leading-[18px]">
                                    <img src={staricongreen} alt="star" className="w-[12px] h-[12px]" /> Гарні відгуки
                                </span>
                            </div>
                            {/* Головне фото */}
                            <div className="w-full h-full flex justify-center items-center">
                                <img src={mainMilk} alt="Молоко Яготинське 2,6%" className="w-[222px] h-[297px] object-contain" />
                            </div>
                        </div>

                        {/* Мініатюри */}
                        <div className="flex flex-row justify-between w-full gap-[12px]">
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#EAF7F2] border border-[#265447] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-[56px] h-[79px] object-contain" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-[56px] h-[79px] object-contain" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0">
                                <img src={thumb1} alt="thumb" className="w-[56px] h-[79px] object-contain" />
                            </div>
                        </div>
                    </div>

                    {/* ПРАВА ПАНЕЛЬ */}
                    <div className="w-[623px] shrink-0 flex flex-col">

                        {/* Заголовок та інфо */}
                        <div className="flex flex-col gap-[12px] mb-[32px]">
                            <h1 className="m-0 font-manrope text-[26px] font-[200] leading-[31.2px] text-[#173B33]">
                                Молоко Яготинське пастеризоване 2,6% 870г
                            </h1>
                            <span className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                870 г
                            </span>
                            <div className="flex items-center gap-[8px] font-inter">
                                <div className="flex gap-[4px]">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <img key={i} src={starIcon} alt="star" className="w-[16px] h-[16px]" />
                                    ))}
                                </div>
                                <span className="text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                    <strong className="font-semibold text-[#265447]">4.8</strong> · 128 відгуків
                                </span>
                            </div>
                        </div>

                        {/* Блок ціни */}
                        <div className="flex flex-col items-start gap-[8px] mb-[32px]">
                            <div className="font-manrope text-[30px] font-[200] leading-[45px] text-[#173B33]">57.99 ₴</div>
                            <div className="font-inter text-[13px] font-medium leading-[19.5px] text-[#6D8279]">
                                Ціна в <strong className="font-bold text-[13px] leading-[19.5px] text-[#173B33]">NOVUS</strong>
                            </div>
                            <div className="px-[10px] py-[4px] rounded-[6px] bg-[#FFF2F1] font-inter text-[13px] font-semibold leading-[19.5px] text-[#D94841]">
                                Залишилось мало
                            </div>
                        </div>

                        {/* Кнопки дій */}
                        <div className="flex items-center gap-[12px] mb-[12px]">
                            <div className="flex items-center h-[44px] px-[8px] rounded-[10px] border border-[rgba(38,84,71,0.16)]">
                                <button className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] cursor-pointer">-</button>
                                <span className="w-[32px] text-center font-inter text-[16px] font-semibold text-[#111827]">1</span>
                                <button className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] cursor-pointer">+</button>
                            </div>
                            <button className="h-[44px] px-[24px] rounded-[10px] border-none bg-[#265447] font-inter text-[13px] font-semibold text-white whitespace-nowrap cursor-pointer transition-colors duration-200 hover:bg-[#1A3E2F]">
                                Додати до кошика
                            </button>
                            <button className="h-[44px] px-[24px] rounded-[10px] border border-[rgba(38,84,71,0.16)] bg-white font-inter text-[13px] font-semibold text-[#265447] whitespace-nowrap cursor-pointer transition-colors duration-200 hover:bg-[#F9FAFB]">
                                Додати до списку
                            </button>
                        </div>

                        <p className="max-w-[480px] m-0 mb-[32px] font-inter text-[12px] leading-[18px] text-[#6D8279]">
                            Ціни можуть відрізнятися залежно від магазину та часу оновлення.
                        </p>

                        {/* Віджет порівняння цін */}
                        <div className="flex flex-col gap-[16px] p-[24px] rounded-[16px] border border-[rgba(38,84,71,0.08)] bg-white">
                            <div className="flex justify-between items-center">
                                <h3 className="m-0 font-manrope text-[18px] font-[200] leading-[25.2px] text-[#173B33]">Де дешевше?</h3>
                                <span className="px-[12px] py-[4px] rounded-[24px] bg-[#FACC14] font-inter text-[13px] font-bold leading-[19.5px] text-[#173B33]">
                                    Можна зекономити 3.50 ₴
                                </span>
                            </div>

                            <div className="flex flex-col gap-[8px]">
                                {/* NOVUS */}
                                <div className="flex justify-between items-center h-[50px] px-[16px] rounded-[10px] border border-[rgba(38,84,71,0.08)]">
                                    <div className="flex items-center gap-[12px]">
                                        <span className="font-inter text-[14px] font-semibold leading-[21px] text-[#265447]">NOVUS</span>
                                        <span className="font-inter text-[12px] text-[#6B7280]">Поточна ціна</span>
                                    </div>
                                    <div className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">57.99 ₴</div>
                                </div>
                                {/* ATB (Найкраща ціна) */}
                                <div className="flex justify-between items-center h-[50px] px-[16px] rounded-[10px] bg-[#EAF7F2] border border-[#6FE3C2]">
                                    <div className="flex items-center gap-[12px]">
                                        <span className="font-inter text-[14px] font-semibold leading-[21px] text-[#265447]">АТБ</span>
                                        <span className="font-inter text-[12px] font-semibold leading-[18px] text-[#265447]">Найкраща ціна</span>
                                    </div>
                                    <div className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">54.49 ₴</div>
                                </div>
                                {/* Сільпо */}
                                <div className="flex justify-between items-center h-[50px] px-[16px] rounded-[10px] border border-[rgba(38,84,71,0.08)]">
                                    <div className="flex items-center gap-[12px]">
                                        <span className="font-inter text-[14px] font-semibold leading-[21px] text-[#265447]">Сільпо</span>
                                    </div>
                                    <div className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">61.99 ₴</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
