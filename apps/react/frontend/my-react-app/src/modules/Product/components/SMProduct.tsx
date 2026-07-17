import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useFetchCarts, useUpdateCartItem } from '@/hooks/api/useCartApi';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { generateSlug } from '@/shared/utils/url';

import zagluska from '@/shared/assets/Vectorbuttle.svg';

const SmCard = ({ product }: { product: Product }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { data: carts } = useFetchCarts();
    const { mutateAsync: updateCartItem } = useUpdateCartItem();
    const { activeCartId } = useCartStore();

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
            className="sm-product-card w-full h-auto min-h-[420px] bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[16px] flex flex-col box-border cursor-pointer transition-all duration-200 hover:border-[#265447]/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] no-underline text-inherit block active:scale-[0.98]"
        >
            <div className="w-full h-[339px] rounded-[10px] bg-white p-[16px] mb-[16px] overflow-hidden flex justify-center items-center">
                <img
                    src={product.image_url || zagluska}
                    alt={product.title}
                    className="max-w-full max-h-full object-contain"
                />
            </div>
            <h3
                className="font-manrope text-[14px] font-[200] text-white leading-[1.4] m-0 mb-[8px] overflow-hidden"
                style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
            >
                {product.title}
            </h3>
            <span className="font-inter text-[12px] text-[#94A3B8] font-normal mb-[16px]">
                {displayWeight}
            </span>
            <div className="mt-auto flex justify-between items-center">
                <span className="font-manrope text-[16px] font-[200] text-[#94A3B8]">
                    {minPrice ? `${minPrice} ₴` : 'Немає'}
                </span>
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || !minPrice}
                    className="h-[26px] px-[12px] rounded-[10px] bg-[#3DAE8B] border-none flex justify-center items-center cursor-pointer font-inter text-[12px] font-semibold text-[#111A17] transition-all duration-200 hover:bg-[#2E9B78] disabled:opacity-50"
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
                const response = await apiClient.get('/api/v1/products', { params: { category: categoryId } });
                let allProducts: Product[] = response.data?.items || response.data || [];
                allProducts = allProducts.filter((p: Product) => p.id !== currentProduct.id);
                const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4);
                const detailed = await Promise.all(
                    selected.map(async (p: Product) => {
                        try { const res = await apiClient.get(`/api/v1/products/${p.id}`); return res.data; }
                        catch { return p; }
                    })
                );
                setSimilarProducts(detailed);
            } catch (error) {
                console.error('Помилка завантаження схожих товарів:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSimilarProducts();
    }, [currentProduct]);

    if (isLoading || similarProducts.length === 0) return null;

    return (
        <section className="w-full pb-[32px] bg-[#111A17]">
            <div className="w-full max-w-[1180px] mx-auto px-[20px] sm:px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] text-white leading-[31.2px] m-0 mb-[24px]">
                    Схожі товари
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-[24px]">
                    {similarProducts.map((prod) => (
                        <SmCard key={prod.id} product={prod} />
                    ))}
                </div>
            </div>
        </section>
    );
}