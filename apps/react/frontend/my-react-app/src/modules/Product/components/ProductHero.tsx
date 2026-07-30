import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Product } from '../type';
import axios from 'axios';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchProductReviews } from '@/hooks/api/useReviewsApi';
import zeroStar from '@/shared/assets/star-for-review.svg';
import { useCreateCart, useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { useLocationStore } from '@/shared/store/locationStore';
import { getOptionalCityFilter, matchesCityFilter } from '@/shared/utils/city';

import mainMilk from '@/shared/assets/milk.svg';
import starIcon from '@/shared/assets/gold-star.svg';
import staricongreen from '@/shared/assets/star.svg';

interface ProductHeroProps {
    product: Product | null;
}

export function ProductHero({ product }: ProductHeroProps) {
    // === ОНОВЛЕНИЙ БЛОК ПАРСИНГУ ID ===
    const params = useParams<{ idAndSlug?: string; id?: string }>();
    const rawParam = params.idAndSlug || params.id; 
    const extractedId = rawParam ? rawParam.split('-')[0] : null;
    const productId = product?.id ?? (extractedId ? Number(extractedId) : null);
    // ====================================

    const { isAuthenticated, user } = useAuthStore();
    const { data: carts, isLoading: isCartsLoading } = useFetchCarts();
    const { mutateAsync: updateCartItem } = useUpdateCartItem();
    const { mutateAsync: createCart } = useCreateCart();
    const activeCartId = useCartStore((state) => state.activeCartId);
    const setActiveCart = useCartStore((state) => state.setActiveCart);
    const { isFavorite, add: addFavorite, remove: removeFavorite } = useFavoritesStore();
    const currentCity = useLocationStore((state) => state.currentCity);
    const isCityFilterEnabled = useLocationStore((state) => state.isCityFilterEnabled);
    const cityFilter = getOptionalCityFilter(currentCity, isCityFilterEnabled);
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState<number>(1);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [selectedCartOverride, setSelectedCartOverride] = useState<string | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const selectedCart =
        (selectedCartOverride && carts?.some((cart) => cart.id === selectedCartOverride)
            ? selectedCartOverride
            : null) ??
        (activeCartId && carts?.some((cart) => cart.id === activeCartId) ? activeCartId : null) ??
        carts?.[0]?.id ??
        null;

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
        if (mod100 >= 11 && mod100 <= 19) {
            return 'відгуків';
        }
        if (mod10 === 1) {
            return 'відгук';
        }
        if (mod10 >= 2 && mod10 <= 4) {
            return 'відгуки';
        }
        return 'відгуків';
    };

    const handleIncrease = () => setQuantity((prev) => prev + 1);
    const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = async () => {
        const targetId = product?.id || productId;

        if (!isAuthenticated || !userId) {
            navigate('/auth');
            return;
        }
        if (targetId == null || isCartsLoading) {
            return;
        }

        try {
            setIsAdding(true);
            let targetCartId = selectedCart;

            if (!targetCartId) {
                targetCartId = await createCart('Мій кошик');
                setActiveCart(targetCartId);
            }

            await updateCartItem({
                cartId: targetCartId,
                productId: String(targetId),
                quantity
            });

            alert('Товар успішно додано до кошика!');
            setQuantity(1);

        } catch (error: unknown) {
            console.error('Повна помилка кошика:', error);
            if (axios.isAxiosError(error)) {
                const detail = error.response?.data?.detail;

                if (Array.isArray(detail)) {
                    const errorMessages = detail.map((entry: unknown) => {
                        const validationError = entry as {
                            loc?: Array<string | number>;
                            msg?: string;
                        };
                        return `Поле: [${validationError.loc?.join(' -> ') ?? 'невідоме'}] | Проблема: ${validationError.msg ?? 'невідома'}`;
                    }).join('\n');
                    alert(`Помилка даних (422):\n${errorMessages}`);
                } else {
                    const backendMessage = detail || error.response?.data?.message || 'Помилка мережі';
                    alert(`Помилка: ${backendMessage}\nКод: ${error.response?.status}`);
                }
            } else {
                alert(`Помилка: Невідома помилка`);
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

    const getLatestPrices = () => {
        if (!product.prices || product.prices.length === 0) return [];
        const latestMap: Record<string, typeof product.prices[0]> = {};
        product.prices
          .filter((item) => matchesCityFilter(item.store.city, cityFilter))
          .forEach((item) => {
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
    const activeSelectedStoreId = selectedStoreId
        && sortedPrices.some((price) => price.store_id === selectedStoreId)
        ? selectedStoreId
        : null;

    // Determine the active price object based on selected store
    const activePriceObj = activeSelectedStoreId
        ? sortedPrices.find(p => p.store_id === activeSelectedStoreId) || cheapestPriceObj
        : cheapestPriceObj;
    const isProductAvailable = Boolean(activePriceObj && activePriceObj.in_stock !== false);

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
        <section className="w-full bg-[#F6FAF8] dark:bg-[#111A17] font-inter pt-[32px] pb-[32px] transition-colors">
            <div className="w-full max-w-[1228px] mx-auto px-[24px] flex flex-col gap-[32px]">

                {/* Хлібні крихти */}
                <nav className="flex items-center gap-[8px] min-h-[24px] text-[13px] -mb-[16px]">
                    <a href="/" className="text-[#6D8279] dark:text-[#A9B6B0] no-underline font-medium transition-colors duration-200 hover:text-[#265447] dark:hover:text-[#3DAE8B]">Головна</a>
                    <span className="text-[#D1D5DB] dark:text-[#2B4236] text-[12px]">/</span>
                    <a href="/catalog" className="text-[#6D8279] dark:text-[#A9B6B0] no-underline font-medium transition-colors duration-200 hover:text-[#265447] dark:hover:text-[#3DAE8B]">Каталог</a>
                    <span className="text-[#D1D5DB] dark:text-[#2B4236] text-[12px]">/</span>
                    <span className="text-[#111827] dark:text-[#EAF7F2] font-semibold">{product.title}</span>
                </nav>

                {/* Основний контент товару */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-[32px] lg:gap-[40px]">

                    {/* ЛІВА ПАНЕЛЬ */}
                    <div className="w-full lg:w-[453px] shrink-0 flex flex-col gap-[16px]">
                        {/* Галерея */}
                        <div className="relative w-full max-w-[453px] aspect-square rounded-[24px] bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 flex justify-center items-center p-[24px] mx-auto shadow-sm">
                            {/* Бейджі */}
                            <div className="absolute top-[21px] left-[21px] flex flex-col items-start gap-[8px] z-[2]">
                                {activePriceObj?.old_price && activePriceObj.old_price > activePriceObj.price && (
                                    <span className="inline-flex items-center gap-[4px] h-[26px] px-[12px] rounded-[16px] bg-[#FACC14] text-[#173B33] font-inter text-[12px] font-semibold leading-[18px]">
                                        Акція
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-[4px] h-[28px] px-[12px] rounded-[16px] bg-white dark:bg-[#1C2723] border border-[#265447] dark:border-[#3DAE8B] text-[#265447] dark:text-[#3DAE8B] font-inter text-[12px] font-semibold leading-[18px]">
                                    <img src={staricongreen} alt="star" className="w-[12px] h-[12px]" /> Рекомендовано
                                </span>
                            </div>
                            {/* Головне фото */}
                            <div className="w-full h-full flex justify-center items-center">
                                <img
                                    src={product.image_url || mainMilk}
                                    alt={product.title}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ viewTransitionName: `product-image-${product.id}` }}
                                />
                            </div>
                        </div>

                        {/* Мініатюри */}
                        <div className="flex flex-row justify-center lg:justify-between w-full gap-[12px]">
                            <div className="w-[100px] h-[100px] sm:w-[143px] sm:h-[143px] rounded-[16px] bg-[#F6FAF8] dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 flex justify-center items-center cursor-pointer shrink-0 p-[12px] shadow-sm">
                                <img src={product.image_url || mainMilk} alt="thumb" className="max-w-full max-h-full object-contain opacity-70" />
                            </div>
                        </div>
                    </div>

                    {/* ПРАВА ПАНЕЛЬ */}
                    <div className="w-full lg:w-[623px] lg:shrink-0 flex flex-col">

                        {/* Заголовок та інфо */}
                        <div className="flex flex-col gap-[12px] mb-[32px]">
                            <h1 className="m-0 font-manrope text-[24px] sm:text-[26px] font-[200] leading-[31.2px] text-[#173B33] dark:text-[#EAF7F2]">
                                {product.title}
                            </h1>
                            <span className="font-inter text-[13px] font-normal leading-[19.5px] text-[#6D8279] dark:text-[#A9B6B0]">
                                Вага/об'єм: {displayWeight}
                            </span>
                            <div className="flex items-center gap-[8px] font-inter">
                                <div className="flex gap-[4px]">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <img
                                            key={i}
                                            src={i < filledStarsAvg ? starIcon : zeroStar}
                                            alt="star"
                                            className="w-[16px] h-[16px]"
                                        />
                                    ))}
                                </div>
                                <span className="text-[13px] font-normal leading-[19.5px] text-[#6D8279] dark:text-[#A9B6B0]">
                                    <strong className="font-semibold text-[#265447] dark:text-[#3DAE8B]">{avgRatingDisplay}</strong> · {reviewsCount} {getReviewsWord(reviewsCount)}
                                </span>
                            </div>
                        </div>

                        {/* Блок ціни */}
                        <div className="flex flex-col items-start gap-[8px] mb-[32px]">
                            <div className="flex items-baseline gap-[12px]">
                                <div className="font-manrope text-[28px] sm:text-[30px] font-[200] leading-[45px] text-[#173B33] dark:text-[#EAF7F2]">
                                    {activePriceObj ? `${activePriceObj.price.toFixed(2)} ₴` : 'Немає в наявності'}
                                </div>
                                {activePriceObj?.old_price && activePriceObj.old_price > activePriceObj.price && (
                                    <div className="font-inter text-[18px] line-through text-[#9CA3AF] dark:text-[#6D8279]">
                                        {activePriceObj.old_price.toFixed(2)} ₴
                                    </div>
                                )}
                            </div>
                            {activePriceObj && (
                                <div className="font-inter text-[13px] font-medium leading-[19.5px] text-[#6D8279] dark:text-[#A9B6B0]">
                                    {activePriceObj === cheapestPriceObj
                                        ? <>Найкраща ціна в <strong className="font-bold text-[13px] leading-[19.5px] text-[#173B33] dark:text-[#EAF7F2]">{activePriceObj.store.name}</strong></>
                                        : <>Ціна в <strong className="font-bold text-[13px] leading-[19.5px] text-[#173B33] dark:text-[#EAF7F2]">{activePriceObj.store.name}</strong></>
                                    }
                                </div>
                            )}
                            <div className={`px-[10px] py-[4px] rounded-[6px] font-inter text-[13px] font-semibold leading-[19.5px] ${isProductAvailable ? 'bg-[#EAF7F2] dark:bg-[#EAF7F2]/10 text-[#265447] dark:text-[#3DAE8B]' : 'bg-[#FFF2F1] dark:bg-[#FFF2F1]/10 text-[#D94841] dark:text-[#EF4444]'
                                }`}>
                                {isProductAvailable ? 'В наявності' : 'Немає в наявності'}
                            </div>
                        </div>

                        {/* Кнопки дій */}
                        <div className="flex flex-wrap items-center gap-[12px] mb-[12px]">
                            <div className="flex items-center h-[44px] px-[8px] rounded-[10px] border border-[rgba(38,84,71,0.16)] dark:border-[#265447]/30 bg-white dark:bg-[#1D2A25] shadow-sm">
                                <button
                                    type="button"
                                    onClick={handleDecrease}
                                    disabled={quantity <= 1 || !isProductAvailable}
                                    aria-label="Зменшити кількість"
                                    className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] dark:text-[#A9B6B0] cursor-pointer disabled:opacity-30 transition-opacity"
                                >
                                    -
                                </button>
                                <span className="w-[32px] text-center font-inter text-[16px] font-semibold text-[#111827] dark:text-[#EAF7F2]">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleIncrease}
                                    disabled={!isProductAvailable}
                                    aria-label="Збільшити кількість"
                                    className="w-[36px] h-full bg-transparent border-none text-[20px] text-[#4B5563] dark:text-[#A9B6B0] cursor-pointer hover:text-[#173B33] dark:hover:text-white transition-colors disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>

                            {/* ДОДАТИ В КОШИК */}
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={isAdding || !isProductAvailable || (isAuthenticated && isCartsLoading)}
                                className="h-[44px] px-[24px] rounded-[10px] border-none bg-[#265447] dark:bg-[#3DAE8B] font-inter text-[13px] font-semibold text-white dark:text-[#111A17] whitespace-nowrap cursor-pointer transition-colors duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isAdding ? 'Додаємо...' : 'Додати до кошика'}
                            </button>

                            {/* ДОДАТИ В УЛЮБЛЕНІ */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!isAuthenticated) { navigate('/auth'); return; }
                                    if (isFavorite(product.id)) {
                                        removeFavorite(product.id);
                                    } else {
                                        addFavorite({
                                            product_id: product.id,
                                            product_title: product.title,
                                            product_image_url: product.image_url ?? undefined,
                                            product_price: activePriceObj?.price || undefined,
                                        });
                                    }
                                }}
                                className={`h-[44px] px-[24px] rounded-[10px] border flex items-center justify-center gap-2 font-inter text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 ${
                                    isFavorite(product.id)
                                        ? 'border-[#E11D48] text-[#E11D48] bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40'
                                        : 'border-[rgba(38,84,71,0.16)] dark:border-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] bg-white dark:bg-[#1D2A25] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2723]'
                                }`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {isFavorite(product.id) ? 'В улюблених' : 'В улюблені'}
                            </button>
                        </div>

                        <p className="max-w-[480px] m-0 mb-[16px] font-inter text-[12px] leading-[18px] text-[#6D8279] dark:text-[#A9B6B0]">
                            Ціни можуть відрізнятися залежно від магазину та часу оновлення.
                        </p>

                        {/* Блок вибору кошика (якщо кошиків більше одного) */}
                        {isAuthenticated && carts && carts.length > 1 && (
                            <div className="flex flex-col gap-[8px] mb-[32px] max-w-[320px]">
                                <label className="font-inter text-[13px] font-semibold text-[#173B33] dark:text-[#EAF7F2]">
                                    Оберіть кошик для додавання:
                                </label>
                                <select
                                    className="h-[44px] px-[16px] rounded-[10px] border border-[rgba(38,84,71,0.16)] dark:border-[#265447]/30 bg-white dark:bg-[#1D2A25] font-inter text-[13px] text-[#173B33] dark:text-[#EAF7F2] outline-none"
                                    value={selectedCart || ''}
                                    onChange={(e) => setSelectedCartOverride(e.target.value)}
                                >
                                    <option value="" disabled>-- Оберіть кошик --</option>
                                    {carts.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {/* Відступ для віджета, якщо немає вибору кошика */}
                        {!(isAuthenticated && carts && carts.length > 1) && (
                            <div className="mb-[32px]"></div>
                        )}
                        {/* Віджет порівняння цін */}
                        <div className="flex flex-col gap-[16px] p-[24px] rounded-[16px] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 bg-white dark:bg-[#1D2A25] shadow-sm">
                            <div className="flex justify-between items-center">
                                <h3 className="m-0 font-manrope text-[18px] font-[200] leading-[25.2px] text-[#173B33] dark:text-white">Де дешевше?</h3>
                                {savings > 0 && (
                                    <span className="px-[12px] py-[4px] rounded-[24px] bg-[#FACC14] font-inter text-[13px] font-bold leading-[19.5px] text-[#173B33]">
                                        Можна зекономити {savings.toFixed(2)} ₴
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-[8px] max-h-[220px] overflow-y-auto">
                                {sortedPrices.length === 0 ? (
                                    <div className="font-inter text-[14px] text-[#6D8279] dark:text-[#A9B6B0] text-center py-4">
                                        Дані про ціни в інших магазинах відсутні.
                                    </div>
                                ) : (
                                    sortedPrices.map((priceObj, index) => {
                                        const isCheapest = index === 0 && sortedPrices.length > 1;
                                        const isSelected = activeSelectedStoreId
                                            ? priceObj.store_id === activeSelectedStoreId
                                            : index === 0;
                                        return (
                                            <div
                                                key={priceObj.id}
                                                onClick={() => handleSelectStore(priceObj.store_id)}
                                                className={`shrink-0 flex justify-between items-center h-auto py-3 sm:h-[50px] px-[16px] rounded-[10px] cursor-pointer transition-all duration-200 ${isSelected
                                                        ? 'bg-[#EAF7F2] dark:bg-[#265447]/30 border-[2px] border-[#265447] dark:border-[#3DAE8B] shadow-[0_0_0_1px_rgba(38,84,71,0.12)]'
                                                        : isCheapest
                                                            ? 'bg-[#EAF7F2] dark:bg-[#265447]/20 border border-[#6FE3C2] dark:border-[#3DAE8B]/40 hover:border-[#265447] dark:hover:border-[#3DAE8B] hover:shadow-[0_2px_8px_rgba(38,84,71,0.1)]'
                                                            : 'bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 hover:border-[#6FE3C2] dark:hover:border-[#3DAE8B]/60 hover:shadow-[0_2px_8px_rgba(38,84,71,0.1)]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-[12px] flex-wrap">
                                                    <span className="font-inter text-[14px] font-semibold leading-[21px] text-[#265447] dark:text-[#3DAE8B]">
                                                        {formatRetailChainName(priceObj.store.retail_chain)}
                                                    </span>
                                                    <span className="font-inter text-[12px] text-[#6D8279] dark:text-[#A9B6B0] max-w-[200px] truncate">
                                                        ({priceObj.store.name})
                                                    </span>
                                                    {isCheapest && (
                                                        <span className="font-inter text-[11px] font-semibold leading-[16px] text-[#265447] dark:text-[#3DAE8B] bg-[#6FE3C2]/20 dark:bg-[#3DAE8B]/20 px-[8px] py-[2px] rounded-[12px]">
                                                            Найкраща ціна
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-[8px]">
                                                    {priceObj.old_price && priceObj.old_price > priceObj.price && (
                                                         <span className="font-inter text-[13px] line-through text-[#9CA3AF] dark:text-[#6D8279]">
                                                             {priceObj.old_price.toFixed(2)} ₴
                                                         </span>
                                                     )}
                                                    <div className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447] dark:text-[#EAF7F2]">
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
