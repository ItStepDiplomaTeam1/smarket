import React, { useState, useEffect } from 'react';
import axios from 'axios';
import zagluska from '@/shared/assets/products-zaglushka.svg';
import { apiClient } from '../../../shared/api/apiClient';
import { type Product } from '../type';
import { useAuthStore } from '@/modules/Auth/store/authStore'; 

const FbtCard = ({ product }: { product: Product }) => {
    const [isAdding, setIsAdding] = useState<boolean>(false);
    
    const { user } = useAuthStore();
    const userId = user?.id;

    const minPrice = product.prices && product.prices.length > 0 
        ? Math.min(...product.prices.map(p => p.price)).toFixed(2) 
        : null;

    const displayWeight = product.weight && product.weight > 0 
        ? `${product.weight} ${product.unit || 'г'}` 
        : (product.unit === 'kg' ? '1 кг' : `1 ${product.unit || 'шт'}`);

   const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        
        if (!userId) {
            alert('Будь ласка, увійдіть в систему, щоб додавати товари до кошика.');
            return;
        }
        
        try {
            setIsAdding(true);

            let cartId = localStorage.getItem('cart_id');

            if (!cartId) {
                const cartResponse = await apiClient.post('/api/v1/cart/', {
                    user_id: userId,
                    name: "Default Cart" 
                });
                
                cartId = cartResponse.data.id;
                localStorage.setItem('cart_id', cartId!);
            }
            
            await apiClient.post(`/api/v1/cart/${cartId}/items`, {
                product_id: product.id,
                quantity: 1
            });
            
            alert('Товар успішно додано до кошика!');
            
        } catch (error: unknown) {
            console.error('Повна помилка кошика:', error);
            if (axios.isAxiosError(error)) {
                const detail = error.response?.data?.detail;
                
                if (Array.isArray(detail)) {
                    const errorMessages = detail.map(err => `Поле: [${err.loc.join(' -> ')}] | Проблема: ${err.msg}`).join('\n');
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
        <div className="w-[175px] h-[296px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[16px] flex flex-col box-border">
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
        </div>
    );
};

interface FBTProps {
    title?: string;
}

export function FBT({ title = "З цим товаром також купують" }: FBTProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRandomProducts = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get('/api/v1/products');
                
                const allProducts = response.data?.items || response.data || [];

                const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 6);

                const detailed = await Promise.all(
                    selected.map(async (p: Product) => {
                        try {
                            const detailRes = await apiClient.get(`/api/v1/products/${p.id}`);
                            return detailRes.data;
                        } catch (err) {
                            console.error(`Помилка отримання цін для товару ${p.id}:`, err);
                            return p;
                        }
                    })
                );

                setProducts(detailed);
            } catch (error) {
                console.error("Помилка завантаження рекомендацій:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRandomProducts();
    }, []);

    if (isLoading || products.length === 0) return null;

    return (
        <section className="w-full pb-[40px] bg-[#F6FAF8]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
                    {title}
                </h2>
                <div className="flex gap-[24px] overflow-x-auto pb-[16px]">
                    {products.map((product) => (
                        <FbtCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}