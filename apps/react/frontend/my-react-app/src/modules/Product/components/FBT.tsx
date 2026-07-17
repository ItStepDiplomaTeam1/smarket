import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { generateSlug } from '@/shared/utils/url';
import zagluska from '@/shared/assets/products-zaglushka.svg';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { useNavigate } from 'react-router-dom';

const RecentlyViewedCard = ({ product }: { product: Product }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { data: carts } = useFetchCarts();
    const { mutateAsync: updateCartItem } = useUpdateCartItem();
    const { activeCartId } = useCartStore();
    const { isFavorite, add: addFavorite, remove: removeFavorite } = useFavoritesStore();
    const navigate = useNavigate();

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

        if (!userId) {
            alert('Будь ласка, увійдіть в систему, щоб додавати товари до кошика.');
            return;
        }
        
        try {
            setIsAdding(true);

            if (isAuthenticated && targetCartId) {
                await updateCartItem({
                    cartId: targetCartId,
                    productId: String(product.id),
                    quantity: 1
                });
            } else if (isAuthenticated) {
                const cartResponse = await apiClient.post('/api/v1/cart/', {
                    name: "Мій кошик"
                });
                const newCartId = cartResponse.data.id;
                await apiClient.post(`/api/v1/cart/${newCartId}/items`, {
                    product_id: product.id,
                    quantity: 1
                });
            }
            
            alert('Товар успішно додано до кошика!');
            
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
                alert(`Помилка: Невідома помилка`);
            }
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Link 
            to={`/product/${product.id}-${generateSlug(product.title)}`}
            className="w-[175px] h-[296px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[16px] flex flex-col box-border relative cursor-pointer no-underline text-inherit block"
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
            <div className="w-full h-[141px] rounded-[10px] flex justify-center items-center mb-[16px]">
                <img 
                    src={product.image_url || zagluska} 
                    alt={product.title} 
                    className="w-full h-full object-contain rounded-[8px]" 
                />
            </div>
            <h3 
                className="font-manrope text-[14px] font-normal text-[#173B33] leading-[1.4] m-0 mb-[4px] h-[40px] overflow-y-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(38, 84, 71, 0.2) transparent'
                }}
            >
                {product.title}
            </h3>
            <span className="font-inter text-[12px] text-[#6D8279] font-normal mb-[16px]">
                {displayWeight}
            </span>
            <div className="mt-auto flex justify-between items-center">
                <span className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">
                    {minPrice ? `${minPrice} ₴` : 'Немає'}
                </span>
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || !minPrice}
                    className="w-[32px] h-[32px] rounded-[6px] bg-[#EAF7F2] border-none flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#F6FAF8] disabled:opacity-50"
                >
                    {isAdding ? (
                        <span className="text-[10px] text-[#265447]">...</span>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 3.33331V12.6666" stroke="#265447" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.33337 8H12.6667" stroke="#265447" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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

export function RecentlyViewed({ 
    title = "Ви нещодавно переглядали", 
    currentProductId 
}: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRecentlyViewed = async () => {
            try {
                setIsLoading(true);
                const stored = localStorage.getItem('recently_viewed_products');
                
                if (!stored) {
                    setIsLoading(false);
                    return;
                }

                let viewedIds: string[] = JSON.parse(stored);

                if (currentProductId) {
                    viewedIds = viewedIds.filter(id => id !== String(currentProductId));
                }

                const selectedIds = viewedIds.slice(0, 6);

                if (selectedIds.length === 0) {
                    setIsLoading(false);
                    return;
                }

                const detailed = await Promise.all(
                    selectedIds.map(async (id) => {
                        try {
                            const detailRes = await apiClient.get(`/api/v1/products/${id}`);
                            return detailRes.data;
                        } catch (err) {
                            console.error(`Помилка отримання товару ${id}:`, err);
                            return null;
                        }
                    })
                );

                setProducts(detailed.filter(Boolean));
            } catch (error) {
                console.error("Помилка завантаження нещодавно переглянутих:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentlyViewed();
    }, [currentProductId]);

    if (isLoading || products.length === 0) return null;

    return (
        <section className="w-full pb-[40px] bg-[#F6FAF8]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
                    {title}
                </h2>
                <div className="flex gap-[24px] overflow-x-auto pb-[16px]">
                    {products.map((product) => (
                        <RecentlyViewedCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}