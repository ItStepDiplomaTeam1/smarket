import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import axios from 'axios';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchProductReviews } from '@/hooks/api/useReviewsApi';
import zeroStar from '@/shared/assets/star-for-review.svg';
import { useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';

import mainMilk from '@/shared/assets/milk.svg';
import starIcon from '@/shared/assets/gold-star.svg';
import staricongreen from '@/shared/assets/star.svg';
import minusgreen from '@/shared/assets/minusgreen.svg';
import plusforblack from '@/shared/assets/plusforblack.svg';

interface ProductHeroProps {
    product: Product | null;
}

function TransparentImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [processedSrc, setProcessedSrc] = useState<string>(src);

    useEffect(() => {
        if (!src) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setProcessedSrc(src);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // BFS Flood Fill from corners to clear only the background white
            const width = canvas.width;
            const height = canvas.height;
            const visited = new Uint8Array(width * height);
            const queue: [number, number][] = [];

            const isWhite = (x: number, y: number) => {
                const idx = (y * width + x) * 4;
                return data[idx] > 240 && data[idx + 1] > 240 && data[idx + 2] > 240;
            };

            const add = (x: number, y: number) => {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const idx = y * width + x;
                    if (!visited[idx] && isWhite(x, y)) {
                        visited[idx] = 1;
                        queue.push([x, y]);
                    }
                }
            };

            // Add edges
            for (let x = 0; x < width; x++) {
                add(x, 0);
                add(x, height - 1);
            }
            for (let y = 0; y < height; y++) {
                add(0, y);
                add(width - 1, y);
            }

            while (queue.length > 0) {
                const [cx, cy] = queue.shift()!;
                const idx = (cy * width + cx) * 4;
                data[idx + 3] = 0; // make transparent

                add(cx + 1, cy);
                add(cx - 1, cy);
                add(cx, cy + 1);
                add(cx, cy - 1);
            }

            ctx.putImageData(imgData, 0, 0);
            try {
                setProcessedSrc(canvas.toDataURL());
            } catch (e) {
                console.error('Canvas conversion failed, fallback to original:', e);
                setProcessedSrc(src);
            }
        };

        img.onerror = () => {
            setProcessedSrc(src);
        };
    }, [src]);

    return <img src={processedSrc} alt={alt} className={className} />;
}

export function ProductHero({ product }: ProductHeroProps) {
    const params = useParams<{ idAndSlug?: string; id?: string }>();
    const rawParam = params.idAndSlug || params.id;
    const extractedId = rawParam ? rawParam.split('-')[0] : null;
    const productId = product?.id ?? (extractedId ? Number(extractedId) : null);

    const { isAuthenticated, user } = useAuthStore();
    const { data: carts } = useFetchCarts();
    const { mutateAsync: updateCartItem } = useUpdateCartItem();
    const { activeCartId } = useCartStore();

    const [quantity, setQuantity] = useState<number>(1);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [selectedCart, setSelectedCart] = useState<string | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    useEffect(() => {
        if (carts && carts.length > 0) {
            if (activeCartId && carts.find(c => c.id === activeCartId)) {
                setSelectedCart(activeCartId);
            } else {
                setSelectedCart(carts[0].id);
            }
        }
    }, [carts, activeCartId]);

    const userId = user?.id;

    const targetId = productId || 1;
    const { data: reviews = [] } = useFetchProductReviews(targetId);

    const reviewsCount = reviews.length;
    const avgRating = reviewsCount > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount)
        : 0;
    const avgRatingDisplay = avgRating.toFixed(1);
    const filledStarsAvg = Math.round(avgRating);

    const getReviewsWord = (count: number) => {
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (mod100 >= 11 && mod100 <= 19) return 'відгуків';
        if (mod10 === 1) return 'відгук';
        if (mod10 >= 2 && mod10 <= 4) return 'відгуки';
        return 'відгуків';
    };

    const handleIncrease = () => setQuantity((prev) => prev + 1);
    const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = async () => {
        const targetId = product?.id || productId;
        if (isAuthenticated && carts && carts.length > 1 && !selectedCart) {
            alert('Будь ласка, оберіть кошик');
            return;
        }
        const targetCartId = selectedCart || (carts && carts[0]?.id);
        if (!userId) {
            alert('Будь ласка, увійдіть в систему, щоб додавати товари до кошика.');
            return;
        }
        try {
            setIsAdding(true);
            if (isAuthenticated && targetCartId) {
                await updateCartItem({ cartId: targetCartId, productId: String(targetId), quantity });
            } else if (isAuthenticated) {
                const cartResponse = await apiClient.post('/api/v1/cart/', { name: 'Мій кошик' });
                const newCartId = cartResponse.data.id;
                await apiClient.post(`/api/v1/cart/${newCartId}/items`, { product_id: targetId, quantity });
            }
            alert('Товар успішно додано до кошика!');
            setQuantity(1);
        } catch (error: unknown) {
            console.error('Повна помилка кошика:', error);
            if (axios.isAxiosError(error)) {
                const detail = error.response?.data?.detail;
                if (Array.isArray(detail)) {
                    const errorMessages = detail.map((err: any) => `Поле: [${err.loc.join(' -> ')}] | Проблема: ${err.msg}`).join('\n');
                    alert(`Помилка даних (422):\n${errorMessages}`);
                } else {
                    const backendMessage = detail || error.response?.data?.message || 'Помилка мережі';
                    alert(`Помилка: ${backendMessage}\nКод: ${error.response?.status}`);
                }
            } else {
                alert('Помилка: Невідома помилка');
            }
        } finally {
            setIsAdding(false);
        }
    };

    // Intersection Observer
    const sectionRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); } },
            { threshold: 0.08 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    if (!product) {
        return (
            <div className="w-full h-[400px] flex justify-center items-center bg-[#111A17] text-[#3DAE8B] font-semibold">
                Завантаження товару...
            </div>
        );
    }

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
    const cheapestPriceObj = sortedPrices[0] || null;
    const activePriceObj = selectedStoreId
        ? sortedPrices.find(p => p.store_id === selectedStoreId) || cheapestPriceObj
        : cheapestPriceObj;

    const maxPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].price : 0;
    const minPrice = sortedPrices.length > 0 ? sortedPrices[0].price : 0;
    const savings = maxPrice - minPrice;

    const handleSelectStore = (storeId: string) => {
        setSelectedStoreId(storeId);
        setQuantity(1);
    };

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
        <section ref={sectionRef} className="product-hero-section scroll-observe w-full bg-[#111A17] font-inter pt-[32px] pb-[32px]">
            <div className="w-full max-w-[1180px] mx-auto px-[20px] sm:px-[24px] flex flex-col gap-[32px]">

                {/* Хлібні крихти */}
                <nav className="breadcrumb flex items-center gap-[8px] min-h-[24px] text-[13px] -mb-[16px] flex-wrap">
                    <a href="/" className="text-[#94A3B8] no-underline font-medium transition-colors duration-200 hover:text-[#3DAE8B]">Головна</a>
                    <span className="text-[#265447] text-[12px]">/</span>
                    <a href="/catalog" className="text-[#94A3B8] no-underline font-medium transition-colors duration-200 hover:text-[#3DAE8B]">Каталог</a>
                    <span className="text-[#265447] text-[12px]">/</span>
                    <span className="text-white font-semibold truncate max-w-[160px] sm:max-w-none">{product.title}</span>
                </nav>

                {/* Основний контент */}
                <div className="product-hero-layout flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-[40px]">

                    {/* ЛІВА ПАНЕЛЬ */}
                    <div className="product-hero-left w-full lg:w-[453px] shrink-0 flex flex-col gap-[16px]">
                        {/* Галерея */}
                        <div className="product-hero-image relative w-full lg:w-[453px] lg:h-[453px] rounded-[24px] bg-white border border-[rgba(38,84,71,0.08)] flex justify-center items-center p-[24px]">
                            {/* Бейджі */}
                            <div className="absolute top-[16px] left-[16px] sm:top-[21px] sm:left-[21px] flex flex-col items-start gap-[8px] z-[2]">
                                {activePriceObj?.old_price && (
                                    <span className="inline-flex items-center gap-[4px] h-[26px] px-[12px] rounded-[16px] bg-[#FACC14] text-[#111A17] font-inter text-[12px] font-semibold leading-[18px]">
                                        Акція
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-[4px] h-[28px] px-[12px] rounded-[16px] bg-[#1C2723] border border-[#3DAE8B]/40 text-[#3DAE8B] font-inter text-[12px] font-semibold leading-[18px]">
                                    <img src={staricongreen} alt="star" className="w-[12px] h-[12px]" /> Рекомендовано
                                </span>
                            </div>
                            <div className="w-full h-full flex justify-center items-center">
                                <img
                                    src={product.image_url || mainMilk}
                                    alt={product.title}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex flex-row justify-start sm:justify-between w-full gap-[12px] overflow-x-auto scrollbar-hide pb-1">
                            <div className="w-[100px] h-[100px] sm:w-[143px] sm:h-[143px] rounded-[16px] bg-[#111A17] border border-[#3DAE8B]/60 flex justify-center items-center cursor-pointer shrink-0 p-[12px]">
                                <img src={product.image_url || mainMilk} alt="thumb" className="max-w-full max-h-full object-contain opacity-70" />
                            </div>
                        </div>
                    </div>

                    <div className="product-hero-right w-full lg:w-[623px] shrink-0 flex flex-col">

                        <div className="flex flex-col gap-[12px] mb-[32px]">
                            <h1 className="m-0 font-manrope text-[26px] font-[200] leading-[31.2px] text-white">
                                {product.title}
                            </h1>
                            <span className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279]">
                                Вага/об'єм: {displayWeight}
                            </span>
                            <div className="flex items-center gap-[8px] font-inter">
                                <div className="flex gap-[4px]">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <img key={i} src={i < filledStarsAvg ? starIcon : zeroStar} alt="star" className="w-[16px] h-[16px]" />
                                    ))}
                                </div>
                                <span className="text-[13px] font-normal leading-[19.5px] text-[#94A3B8]">
                                    <strong className="font-semibold text-[#94A3B8]">{avgRatingDisplay}</strong> · {reviewsCount} {getReviewsWord(reviewsCount)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-[8px] mb-[32px]">
                            <div className="flex items-baseline gap-[12px]">
                                <div className="product-price-main font-manrope text-[30px] font-[200] leading-[45px] text-white">
                                    {activePriceObj ? `${activePriceObj.price.toFixed(2)} ₴` : 'Немає в наявності'}
                                </div>
                                {activePriceObj?.old_price && (
                                    <div className="font-inter text-[18px] line-through text-[#94A3B8]/50">
                                        {activePriceObj.old_price.toFixed(2)} ₴
                                    </div>
                                )}
                            </div>
                            {activePriceObj && (
                                <div className="font-inter text-[13px] font-medium leading-[19.5px] text-[#94A3B8]">
                                    {activePriceObj === cheapestPriceObj
                                        ? <><span>Найкраща ціна в </span><strong className="font-bold text-[13px] text-[#265447]">{activePriceObj.store.name}</strong></>
                                        : <><span>Ціна в </span><strong className="font-bold text-[13px] text-[#265447]">{activePriceObj.store.name}</strong></>
                                    }
                                </div>
                            )}
                            <div className={`px-[10px] py-[4px] rounded-[6px] font-inter text-[13px] font-semibold leading-[19.5px] ${
                                activePriceObj?.in_stock
                                    ? 'bg-[#173B33] text-[#3DAE8B]'
                                    : 'bg-[#2D1515] text-[#EF4444]'
                            }`}>
                                {activePriceObj?.in_stock ? 'В наявності' : 'Немає в наявності'}
                            </div>
                        </div>

                        <div className="product-actions flex flex-wrap items-center gap-3 mb-[12px]">
                            <div className="flex items-center h-[48px] px-[8px] rounded-[10px] bg-[#173B33] border border-[#265447]/40 shrink-0">
                                <button
                                    onClick={handleDecrease}
                                    disabled={quantity <= 1 || !activePriceObj?.in_stock}
                                    className="w-[44px] h-full bg-transparent border-none flex justify-center items-center cursor-pointer disabled:opacity-30 transition-opacity"
                                    aria-label="Зменшити кількість"
                                >
                                    <img src={minusgreen} alt="minus" className="w-[16px] h-[16px]" />
                                </button>
                                <span className="w-[32px] text-center font-inter text-[16px] font-semibold text-[#4ADE80]">
                                    {quantity}
                                </span>
                                <button
                                    onClick={handleIncrease}
                                    disabled={!activePriceObj?.in_stock}
                                    className="w-[44px] h-full bg-transparent border-none flex justify-center items-center cursor-pointer transition-opacity disabled:opacity-30"
                                    aria-label="Збільшити кількість"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 3.33333V12.6667" stroke="#4ADE80" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M3.33325 8H12.6666" stroke="#4ADE80" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={isAdding || !activePriceObj?.in_stock || (isAuthenticated && carts && carts.length > 1 && !selectedCart)}
                                className="btn-add-to-cart flex-1 min-w-[140px] h-[48px] px-[24px] rounded-[10px] border-none bg-[#3DAE8B] font-inter text-[13px] sm:text-[14px] font-semibold text-[#111A17] whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-[#2E9B78] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {isAdding ? 'Додаємо...' : 'Додати до кошика'}
                            </button>

                            <button className="flex-1 min-w-[120px] h-[48px] px-[24px] rounded-[10px] border border-[#265447]/40 bg-transparent font-inter text-[13px] sm:text-[14px] font-semibold text-[#4ADE80] whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-[#265447]/20 active:scale-[0.98]">
                                Додати до списку
                            </button>
                        </div>

                        <p className="max-w-[480px] m-0 mb-[16px] font-inter text-[12px] leading-[18px] text-white">
                            Ціни можуть відрізнятися залежно від магазину та часу оновлення.
                        </p>

                        {isAuthenticated && carts && carts.length > 1 && (
                            <div className="flex flex-col gap-[8px] mb-[32px] max-w-[320px]">
                                <label className="font-inter text-[13px] font-semibold text-white">
                                    Оберіть кошик для додавання:
                                </label>
                                <select
                                    className="h-[44px] px-[16px] rounded-[10px] border border-[#265447]/40 bg-[#1C2723] font-inter text-[13px] text-white outline-none"
                                    value={selectedCart || ''}
                                    onChange={(e) => setSelectedCart(e.target.value)}
                                >
                                    <option value="" disabled>-- Оберіть кошик --</option>
                                    {carts.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {!(isAuthenticated && carts && carts.length > 1) && (
                            <div className="mb-[32px]"></div>
                        )}

                        <div className="price-widget price-compare-widget flex flex-col gap-[16px] p-[24px] rounded-[16px] border border-[#265447]/8 bg-[#1C2723]">
                            <div className="flex items-center justify-between">
                                <h3 className="m-0 font-manrope text-[18px] font-[200] leading-[25.2px] text-white">Де дешевше?</h3>
                                {savings > 0 && (
                                    <span className="savings-badge px-[12px] py-[4px] rounded-[24px] bg-[#FACC14] font-inter text-[12px] sm:text-[13px] font-bold text-[#173333]">
                                        Можна зекономити {savings.toFixed(2)} ₴
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-[8px] max-h-[200px] overflow-y-auto">
                                {sortedPrices.length === 0 ? (
                                    <div className="font-inter text-[14px] text-[#94A3B8] text-center py-4">
                                        Дані про ціни в інших магазинах відсутні.
                                    </div>
                                ) : (
                                    sortedPrices.map((priceObj: any, index: number) => {
                                        const isCheapest = index === 0 && sortedPrices.length > 1;
                                        const isSelected = selectedStoreId
                                            ? priceObj.store_id === selectedStoreId
                                            : index === 0;
                                        return (
                                            <div
                                                key={priceObj.id}
                                                onClick={() => handleSelectStore(priceObj.store_id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSelectStore(priceObj.store_id)}
                                                className={`price-compare-row shrink-0 flex justify-between items-center min-h-[50px] px-[16px] py-[10px] rounded-[10px] cursor-pointer transition-all duration-200 bg-[#111A17] ${
                                                    isSelected
                                                        ? 'border-[2px] border-[#4ADE80] shadow-[0_0_12px_rgba(74,222,128,0.15)]'
                                                        : isCheapest
                                                            ? 'border border-[#3DAE8B]/40 hover:border-[#4ADE80]/60'
                                                            : 'border border-[#265447]/30 hover:border-[#3DAE8B]/40'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center gap-[8px] sm:gap-[12px]">
                                                    <span className="font-inter text-[13px] sm:text-[14px] font-semibold leading-[21px] text-white">
                                                        {formatRetailChainName(priceObj.store.retail_chain)}
                                                    </span>
                                                    <span className="font-inter text-[11px] sm:text-[12px] text-[#94A3B8] max-w-[130px] sm:max-w-[200px] truncate">
                                                        ({priceObj.store.name})
                                                    </span>
                                                    {isCheapest && (
                                                        <span className="font-inter text-[11px] font-semibold text-[#111A17] bg-[#3DAE8B] px-[8px] py-[2px] rounded-[12px] whitespace-nowrap">
                                                            Найкраща ціна
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-[8px] shrink-0">
                                                    {priceObj.old_price && (
                                                        <span className="font-inter text-[13px] line-through text-[#94A3B8]/50">
                                                            {priceObj.old_price.toFixed(2)} ₴
                                                        </span>
                                                    )}
                                                    <div className={`font-manrope text-[15px] sm:text-[16px] font-[200] leading-[24px] ${isSelected ? 'text-[#4ADE80]' : 'text-white'}`}>
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