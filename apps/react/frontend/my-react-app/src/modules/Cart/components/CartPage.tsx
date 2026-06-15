import React, { useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFetchCarts } from '../../../hooks/api/useCartApi';
import { CartEmptyState } from './CartEmptyState';
import { CartSavedList } from './CartSavedList';
import { CartDetails } from './CartDetails';
import { CartSummary } from './CartSummary';
import { ChevronRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { data: carts, isLoading, isError } = useFetchCarts();
  const { activeCartId, setActiveCart } = useCartStore();

  useEffect(() => {
    // If we have carts and no active cart is selected, select the first one
    if (carts && carts.length > 0 && !activeCartId) {
      setActiveCart(carts[0].id);
    }
  }, [carts, activeCartId, setActiveCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span className="hover:text-gray-900 cursor-pointer">Головна</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Кошик</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Мої кошики</h1>
              <p className="text-gray-500 mt-1">Керуйте своїми списками покупок та порівнюйте ціни</p>
            </div>
            
            {(!isLoading && carts && carts.length > 0) && (
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Перейти в каталог
                </button>
                <button className="px-4 py-2 bg-[#305C50] text-white rounded-lg font-medium hover:bg-[#25473e] transition-colors">
                  Створити новий кошик
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Rendering */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#305C50]"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            Помилка завантаження даних
          </div>
        ) : !carts || carts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex items-center justify-center">
            <CartEmptyState />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-3">
              <CartSavedList />
            </div>
            
            <div className="lg:col-span-6 h-[800px]">
              <CartDetails />
            </div>
            
            <div className="lg:col-span-3">
              <CartSummary />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
