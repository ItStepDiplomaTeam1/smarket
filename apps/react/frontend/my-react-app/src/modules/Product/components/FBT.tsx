import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { generateSlug } from '@/shared/utils/url';
import zagluska from '@/shared/assets/products-zaglushka.svg';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import plusIcon from '@/shared/assets/plusforblack.svg';

const RecentlyViewedCard = ({ product }: { product: Product }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { data: carts } = useFetchCarts();
    const { mutateAsync: updateCartItem } = useUpdateCartItem();
    const { activeCartId } = useCartStore();
    const navigate = useNavigate();
    const { add: addFavorite, remove: removeFavorite, isFavorite } = useFavoritesStore();

    const [isAdding, setIsAdding] = useState<boolean>(false);
    const userId = user?.id;

    const minPrice = product.prices && product.prices.length > 0
        ? Math.min(...product.prices.map(p => p.price)).toFixed(2)
        : null;

    const displayWeight = product.weight && product.weight > 0
        ? `${product.weight} ${product.unit || 'г'}`
        : (product.unit === 'kg' ? '1 кг' : `1 ${product.unit || 'шт'}`);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const targetCartId = activeCartId || (carts && carts[0]?.id);
        if (!userId) { alert('Будь ласка, увійдіть в систему, щоб додавати товари до кошика.'); return; }
        try {
            setIsAdding(true);
            if (isAuthenticated && targetCartId) {
                await updateCartItem({ cartId: targetCartId, productId: String(product.id), quantity: 1 });
            } else if (isAuthenticated) {
                const cartResponse = await apiClient.post('/api/v1/cart/', { name: 'Мій кошик' });
                const newCartId = cartResponse.data.id;
                await apiClient.post(`/api/v1/cart/${newCartId}/items`, { product_id: product.id, quantity: 1 });
            }
            alert('Товар успішно додано до кошика!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const detail = error.response?.data?.detail;
                if (Array.isArray(detail)) {
                    alert(`Помилка даних (422):\n${detail.map((err: any) => `${err.loc.join(' -> ')}: ${err.msg}`).join('\n')}`);
                } else {
                    alert(`Помилка: ${detail || error.response?.data?.message || 'Помилка мережі'}`);
                }
            }
        } finally {
            setIsAdding(false);
        }
    };
    return (
        <Link
            to={`/product/${product.id}-${generateSlug(product.title)}`}
            className="recently-viewed-card w-[155px] sm:w-[175px] h-auto min-h-[260px] sm:h-[296px] shrink-0 bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[14px] sm:p-[16px] flex flex-col box-border relative cursor-pointer transition-all duration-200 hover:border-[#265447]/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] no-underline text-inherit block active:scale-[0.98]"
        >
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isAuthenticated) { navigate('/auth'); return; }
                    if (isFavorite(product.id)) {
                        removeFavorite(product.id);
                    } else {
                        addFavorite({
                            product_id: product.id,
                            product_title: product.title,
                            product_image_url: product.image_url ?? undefined,
                            product_price: Number(minPrice) || undefined,
                        });
                    }
                }}
                className={`absolute top-3 right-3 p-1 border-none bg-transparent cursor-pointer transition-all hover:scale-110 z-10 ${
                    isFavorite(product.id)
                        ? 'text-[#E11D48]'
                        : 'text-[#D1D5DB] hover:text-[#E11D48]'
                }`}
                title="Додати до улюблених"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>
            <div className="w-full h-[141px] rounded-[10px] bg-white p-[8px] flex justify-center items-center mb-[16px] overflow-hidden">
                <img src={product.image_url || zagluska} alt={product.title} className="max-w-full max-h-full object-contain" />
            </div>
            <h3
                className="font-manrope text-[14px] font-normal text-white leading-[1.4] m-0 mb-[4px] h-[40px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(61,174,139,0.2) transparent' }}
            >
                {product.title}
            </h3>
            <span className="font-inter text-[12px] text-[#94A3B8] font-normal mb-[16px]">
                {displayWeight}
            </span>
            <div className="mt-auto flex justify-between items-center">
                <span className="font-manrope text-[16px] font-[200] leading-[24px] text-[#94A3B8]">
                    {minPrice ? `${minPrice} ₴` : 'Немає'}
                </span>
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || !minPrice}
                    className="w-[32px] h-[32px] rounded-[6px] bg-[#3DAE8B] border-none flex justify-center items-center cursor-pointer transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
                >
                    {isAdding ? (
                        <span className="text-[10px] text-[#111A17]">...</span>
                    ) : (
                        <img src={plusIcon} alt="plus" className="w-[16px] h-[16px]" />
                    )}
                </button>
            </div>
        </Link>
    );
};

interface RecentlyViewedProps {
    title?: string;
    currentProductId?: number | string;
}

export function RecentlyViewed({ title = 'Ви нещодавно переглядали', currentProductId }: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRecentlyViewed = async () => {
            try {
                setIsLoading(true);
                const stored = localStorage.getItem('recently_viewed_products');
                if (!stored) { setIsLoading(false); return; }
                let viewedIds: string[] = JSON.parse(stored);
                if (currentProductId) viewedIds = viewedIds.filter(id => id !== String(currentProductId));
                const selectedIds = viewedIds.slice(0, 6);
                if (selectedIds.length === 0) { setIsLoading(false); return; }
                const detailed = await Promise.all(
                    selectedIds.map(async (id) => {
                        try { const res = await apiClient.get(`/api/v1/products/${id}`); return res.data; }
                        catch { return null; }
                    })
                );
                setProducts(detailed.filter(Boolean));
            } catch (error) {
                console.error('Помилка завантаження нещодавно переглянутих:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecentlyViewed();
    }, [currentProductId]);

    if (isLoading || products.length === 0) return null;

    return (
        <section className="w-full pb-[32px] bg-[#111A17]">
            <div className="w-full max-w-[1180px] mx-auto px-[20px] sm:px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-white m-0 mb-[24px]">
                    {title}
                </h2>
                <div className="products-scroll-row scrollbar-hide flex gap-[16px] sm:gap-[24px] overflow-x-auto pb-[16px]">
                    {products.map((product) => (
                        <RecentlyViewedCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}