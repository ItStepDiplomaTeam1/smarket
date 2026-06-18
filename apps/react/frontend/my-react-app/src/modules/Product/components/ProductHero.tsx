import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';

import mainMilk from '@/shared/assets/milk.svg';
import starIcon from '@/shared/assets/gold-star.svg';
import staricongreen from '@/shared/assets/star.svg';

interface ProductHeroProps {
    product: Product | null;
}

export function ProductHero({ product }: ProductHeroProps) {
    const { id } = useParams<{ id: string }>();
    const productId = id || "dddb52b5-fce8-4fde-947d-25625a429690";

    // --- СТЕЙТИ ---
    const [quantity, setQuantity] = useState<number>(1);
    const [isAdding, setIsAdding] = useState<boolean>(false);

    // --- ЛОГІКА КНОПОК ---
    const handleIncrease = () => setQuantity((prev) => prev + 1);
    const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = async () => {
        const targetId = product?.id || productId;

        try {
            setIsAdding(true);
            await apiClient.post('/api/v1/cart/cart/items', {
                product_id: targetId,
                quantity: quantity
            });
            
            alert('Товар успішно додано до кошика!');
            setQuantity(1);
            
        } catch (error: unknown) {
            // РОЗШИРЕНИЙ ВІДЛОВ ПОМИЛОК
            console.error('Повна помилка кошика:', error);
            if (axios.isAxiosError(error)) {
                console.log('Відповідь бекенду:', error.response?.data);
                const backendMessage = error.response?.data?.detail || error.response?.data?.message || 'Помилка мережі (CORS або бекенд недоступний)';
                const statusCode = error.response?.status || 'Без коду';
                alert(`Помилка: ${backendMessage}\nКод: ${statusCode}\n(Подивись консоль для деталей)`);
            } else {
                alert(`Помилка: Невідома помилка\n(Подивись консоль для деталей)`);
            }
        } finally {
            setIsAdding(false);
        }
    };

    if (!product) {
        return (
            <div className="w-full h-[400px] flex justify-center items-center bg-[#F6FAF8] text-[#265447] font-semibold">
                Завантаження товару...
            </div>
        );
    }

    // --- ГРУПУВАННЯ ЦІН ПО МАГАЗИНАХ (ОСТАННЯ ЗА ЧАСОМ) ---
    const getLatestPrices = () => {
        if (!product.prices || product.prices.length === 0) return [];
        const latestMap: Record<string, typeof product.prices[0]> = {};
        product.prices.forEach((item) => {
            const storeId = item.store_id;
            const existing = latestMap[storeId];
            if (!existing || new Date(item.recorded_at) > new Date(existing.recorded_at)) {
                latestMap[storeId] = item;
            }
        });
        return Object.values(latestMap);
    };

    const latestPrices = getLatestPrices();
    const sortedPrices = [...latestPrices].sort((a, b) => a.price - b.price);
    const primaryPriceObj = sortedPrices[0] || null;

    const maxPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].price : 0;
    const minPrice = sortedPrices.length > 0 ? sortedPrices[0].price : 0;
    const savings = maxPrice - minPrice;

    const formatRetailChainName = (chain: string) => {
        if (!chain) return '';
        switch (chain.toLowerCase()) {
            case 'ekomarket': return 'ЕкоМаркет';
            case 'novus': return 'Novus';
            case 'atb': return 'АТБ';
            case 'silpo': return 'Сільпо';
            case 'auchan': return 'Ашан';
            case 'metro': return 'Metro';
            default: return chain.charAt(0).toUpperCase() + chain.slice(1);
        }
    };

    const displayWeight = product.weight && product.weight > 0 
        ? `${product.weight} ${product.unit}` 
        : (product.unit === 'kg' ? '1 кг' : `1 ${product.unit || 'шт'}`);

    return (
        <section className="w-full bg-[#F6FAF8] font-inter pt-[32px] pb-[32px]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px] flex flex-col gap-[32px]">

                {/* Хлібні крихти */}
                <nav className="flex items-center gap-[8px] min-h-[24px] text-[13px] -mb-[16px]">
                    <a href="/" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Головна</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <a href="/catalog" className="text-[#6D8279] no-underline font-medium transition-colors duration-200 hover:text-[#265447]">Каталог</a>
                    <span className="text-[#D1D5DB] text-[12px]">/</span>
                    <span className="text-[#111827] font-semibold">{product.title}</span>
                </nav>

                {/* Основний контент товару */}
                <div className="flex justify-between items-start gap-[40px]">

                    {/* ЛІВА ПАНЕЛЬ */}
                    <div className="w-[453px] shrink-0 flex flex-col gap-[16px]">
                        {/* Галерея */}
                        <div className="relative w-[453px] h-[453px] rounded-[24px] bg-white border border-[rgba(38,84,71,0.08)] flex justify-center items-center p-[24px]">
                            {/* Бейджі */}
                            <div className="absolute top-[21px] left-[21px] flex flex-col items-start gap-[8px] z-[2]">
                                {primaryPriceObj?.old_price && (
                                    <span className="inline-flex items-center gap-[4px] h-[26px] px-[12px] rounded-[16px] bg-[#FACC14] text-[#173B33] font-inter text-[12px] font-semibold leading-[18px]">
                                        Акція
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-[4px] h-[28px] px-[12px] rounded-[16px] bg-white border border-[#265447] text-[#265447] font-inter text-[12px] font-semibold leading-[18px]">
                                    <img src={staricongreen} alt="star" className="w-[12px] h-[12px]" /> Рекомендовано
                                </span>
                            </div>
                            {/* Головне фото */}
                            <div className="w-full h-full flex justify-center items-center">
                                <img 
                                    src={product.image_url || mainMilk} 
                                    alt={product.title} 
                                    className="max-w-full max-h-full object-contain" 
                                />
                            </div>
                        </div>

                        {/* Мініатюри */}
                        <div className="flex flex-row justify-between w-full gap-[12px]">
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#EAF7F2] border border-[#265447] flex justify-center items-center cursor-pointer shrink-0 p-[12px]">
                                <img src={product.image_url || mainMilk} alt="thumb" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0 p-[12px]">
                                <img src={product.image_url || mainMilk} alt="thumb" className="max-w-full max-h-full object-contain opacity-70" />
                            </div>
                            <div className="w-[143px] h-[143px] rounded-[16px] bg-[#F6FAF8] border border-[rgba(38,84,71,0.08)] flex justify-center items-center cursor-pointer shrink-0 p-[12px]">
                                <img src={product.image_url || mainMilk} alt="thumb" className="max-w-full max-h-full object-contain opacity-70" />
                            </div>
                        </div>
                    </div>

                    {/* ПРАВА ПАНЕЛЬ */}
                    <div className="w-[623px] shrink-0 flex flex-col">

                        {/* Заголовок та інфо */}
                        <div className="flex flex-col gap-[12px] mb-[32px]">
                            <h1 className="m-0 font-manrope text-[26px] font-[200] leading-[31.2px] text-[#173B33]">
                                {product.title}
                            </h1>
                            <span className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                Вага/об'єм: {displayWeight}
                            </span>
                            <div className="flex items-center gap-[8px] font-inter">
                                <div className="flex gap-[4px]">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <img key={i} src={starIcon} alt="star" className="w-[16px] h-[16px]" />
                                    ))}
                                </div>
                                <span className="text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                    <strong className="font-semibold text-[#265447]">4.8</strong> · 12 відгуків
                                </span>
                            </div>
                        </div>

                        {/* Блок ціни */}
                        <div className="flex flex-col items-start gap-[8px] mb-[32px]">
                            <div className="flex items-baseline gap-[12px]">
                                <div className="font-manrope text-[30px] font-[200] leading-[45px] text-[#173B33]">
                                    {primaryPriceObj ? `${primaryPriceObj.price.toFixed(2)} ₴` : 'Немає в наявності'}
                                </div>
                                {primaryPriceObj?.old_price && (
                                    <div className="font-inter text-[18px] line-through text-[#9CA3AF]">
                                        {primaryPriceObj.old_price.toFixed(2)} ₴
                                    </div>
                                )}
                            </div>
                            {primaryPriceObj && (
                                <div className="font-inter text-[13px] font-medium leading-[19.5px] text-[#6D8279]">
                                    Найкраща ціна в <strong className="font-bold text-[13px] leading-[19.5px] text-[#173B33]">{primaryPriceObj.store.name}</strong>
                                </div>
                            )}
                            <div className={`px-[10px] py-[4px] rounded-[6px] font-inter text-[13px] font-semibold leading-[19.5px] ${
                                primaryPriceObj?.in_stock ? 'bg-[#EAF7F2] text-[#265447]' : 'bg-[#FFF2F1] text-[#D94841]'
                            }`}>
                                {primaryPriceObj?.in_stock ? 'В наявності' : 'Немає в наявності'}
                            </div>
                        </div>

                        {/* Кнопки дій */}
                        <div className="flex items-center gap-[12px] mb-[12px]">
                            <div className="flex items-center h-[44px] px-[8px] rounded-[10px] border border-[rgba(38,84,71,0.16)]">
                                <button 
                                    onClick={handleDecrease}
                                    disabled={quantity <= 1 || !primaryPriceObj?.in_stock}
                                    className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] cursor-pointer disabled:opacity-30 transition-opacity"
                                >
                                    -
                                </button>
                                <span className="w-[32px] text-center font-inter text-[16px] font-semibold text-[#111827]">
                                    {quantity}
                                </span>
                                <button 
                                    onClick={handleIncrease}
                                    disabled={!primaryPriceObj?.in_stock}
                                    className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] cursor-pointer hover:text-[#173B33] transition-colors disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>
                            
                            {/* ДОДАТИ В КОШИК */}
                            <button 
                                onClick={handleAddToCart}
                                disabled={isAdding || !primaryPriceObj?.in_stock}
                                className="h-[44px] px-[24px] rounded-[10px] border-none bg-[#265447] font-inter text-[13px] font-semibold text-white whitespace-nowrap cursor-pointer transition-colors duration-200 hover:bg-[#1A3E2F] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAdding ? 'Додаємо...' : 'Додати до кошика'}
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
                                {savings > 0 && (
                                    <span className="px-[12px] py-[4px] rounded-[24px] bg-[#FACC14] font-inter text-[13px] font-bold leading-[19.5px] text-[#173B33]">
                                        Можна зекономити {savings.toFixed(2)} ₴
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-[8px]">
                                {sortedPrices.length === 0 ? (
                                    <div className="font-inter text-[14px] text-[#6D8279] text-center py-4">
                                        Дані про ціни в інших магазинах відсутні.
                                    </div>
                                ) : (
                                    sortedPrices.map((priceObj, index) => {
                                        const isCheapest = index === 0 && sortedPrices.length > 1;
                                        return (
                                            <div 
                                                key={priceObj.id} 
                                                className={`flex justify-between items-center h-[50px] px-[16px] rounded-[10px] ${
                                                    isCheapest 
                                                    ? 'bg-[#EAF7F2] border border-[#6FE3C2]' 
                                                    : 'bg-white border border-[rgba(38,84,71,0.08)]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-[12px]">
                                                    <span className="font-inter text-[14px] font-semibold leading-[21px] text-[#265447]">
                                                        {formatRetailChainName(priceObj.store.retail_chain)}
                                                    </span>
                                                    <span className="font-inter text-[12px] text-[#6D8279] max-w-[200px] truncate">
                                                        ({priceObj.store.name})
                                                    </span>
                                                    {isCheapest && (
                                                        <span className="font-inter text-[11px] font-semibold leading-[16px] text-[#265447] bg-[#6FE3C2]/20 px-[8px] py-[2px] rounded-[12px]">
                                                            Найкраща ціна
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-[8px]">
                                                    {priceObj.old_price && (
                                                        <span className="font-inter text-[13px] line-through text-[#9CA3AF]">
                                                            {priceObj.old_price.toFixed(2)} ₴
                                                        </span>
                                                    )}
                                                    <div className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">
                                                        {priceObj.price.toFixed(2)} ₴
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}