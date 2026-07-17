import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; 
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { generateSlug } from '@/shared/utils/url'; 
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { useNavigate } from 'react-router-dom';

import zagluska from '@/shared/assets/Vectorbuttle.svg';

const SmCard = ({ product }: { product: Product }) => {
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
        e.preventDefault();
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

    // ОБГОРНУТО В LINK ЗАМІСТЬ DIV
    return (
        <Link 
            to={`/product/${product.id}-${generateSlug(product.title)}`}
            viewTransition
            className="w-[271px] h-[489px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[16px] flex flex-col box-border cursor-pointer transition-shadow hover:shadow-[0_4px_12px_rgba(38,84,71,0.08)] no-underline text-inherit block relative"
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
                className={`absolute top-4 right-4 p-1 border-none bg-transparent cursor-pointer transition-all hover:scale-110 z-10 ${
                    isFavorite(product.id)
                        ? 'text-[#E11D48]'
                        : 'text-[#D1D5DB] hover:text-[#E11D48]'
                }`}
                title="Додати до улюблених"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>
            <div className="w-full h-[339px] rounded-[10px] flex justify-center items-center mb-[16px] overflow-hidden">
                <img 
                    src={product.image_url || zagluska} 
                    alt={product.title} 
                    className="max-w-[80%] max-h-[80%] object-contain" 
                    style={{ viewTransitionName: `product-image-${product.id}` }}
                />
            </div>
            <h3 
                className="font-manrope text-[14px] font-[200] text-[#173B33] leading-[1.4] m-0 mb-[8px] overflow-hidden"
                style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
            >
                {product.title}
            </h3>
            <span className="font-inter text-[12px] text-[#6D8279] font-normal mb-[16px]">
                {displayWeight}
            </span>
            <div className="mt-auto flex justify-between items-center">
                <span className="font-manrope text-[16px] font-[200] text-[#265447]">
                    {minPrice ? `${minPrice} ₴` : 'Немає'}
                </span>
                <button 
                    onClick={handleAddToCart}
                    disabled={isAdding || !minPrice}
                    className="w-[92px] h-[26px] rounded-[10px] bg-white border border-[rgba(38,84,71,0.16)] flex justify-center items-center cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F6FAF8] disabled:opacity-50"
                >
                    {isAdding ? 'Додаємо...' : 'До кошика'}
                </button>
            </div>
        </Link>
    );
};

interface SMProductProps {
    currentProduct: Product | null;
}

export function SMProduct({ currentProduct }: SMProductProps) {
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!currentProduct?.category && currentProduct?.canonical_category_id == null) {
            setIsLoading(false);
            return;
        }

        const fetchSimilarProducts = async () => {
            try {
                setIsLoading(true);
                const categoryId = currentProduct.canonical_category_id ?? currentProduct.category?.id;
                const response = await apiClient.get('/api/v1/products', {
                    params: { category: categoryId }
                });
                
                let allProducts: Product[] = response.data?.items || response.data || [];

                allProducts = allProducts.filter((p: Product) => p.id !== currentProduct.id);

                const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4);

                const detailed = await Promise.all(
                    selected.map(async (p: Product) => {
                        try {
                            const detailRes = await apiClient.get(`/api/v1/products/${p.id}`);
                            return detailRes.data;
                        } catch (err) {
                            console.error(`Помилка отримання детальної інформації для ${p.id}:`, err);
                            return p;
                        }
                    })
                );

                setSimilarProducts(detailed);
            } catch (error) {
                console.error("Помилка завантаження схожих товарів:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSimilarProducts();
    }, [currentProduct]);

    if (isLoading || similarProducts.length === 0) return null;

    return (
        <section className="w-full pb-[40px] bg-[#F6FAF8]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] text-[#173B33] leading-[31.2px] m-0 mb-[24px]">
                    Схожі товари
                </h2>
                <div className="flex gap-[24px] overflow-x-auto pb-[16px]">
                    {similarProducts.map((prod) => (
                        <SmCard key={prod.id} product={prod} />
                    ))}
                </div>
            </div>
        </section>
    );
}