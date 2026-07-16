import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { useFetchCarts, useCreateCart } from '@/hooks/api/useCartApi';
import { CartEmptyState } from '@/modules/Cart/components/CartEmptyState';
import { CartSavedList } from '@/modules/Cart/components/CartSavedList';
import { CartDetails } from '@/modules/Cart/components/CartDetails';
import { CartSummary } from '@/modules/Cart/components/CartSummary';
import { CartUnauthState } from '@/modules/Cart/components/CartUnauthState';
import { CreateCartModal } from '@/modules/Cart/components/CreateCartModal';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { ChevronRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: carts, isLoading, isError } = useFetchCarts();
  const { mutate: createCart, isPending: isCreating } = useCreateCart();
  const { activeCartId, setActiveCart } = useCartStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // If we have carts and no active cart is selected, select the first one
    if (carts && carts.length > 0 && !activeCartId) {
      setActiveCart(carts[0].id);
    }
  }, [carts, activeCartId, setActiveCart]);

  const handleCreateCart = (name: string) => {
    createCart(name, {
      onSuccess: (newCartId) => {
        setActiveCart(newCartId);
        setIsCreateModalOpen(false);
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] flex flex-col transition-colors duration-200">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mb-8 transition-colors">
            <span className="hover:text-[#173B33] dark:hover:text-white cursor-pointer" onClick={() => navigate('/')}>Головна</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[#173B33] dark:text-white font-medium">Кошик</span>
          </div>
          <CartUnauthState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] flex flex-col transition-colors duration-200">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mb-4 transition-colors">
            <span className="hover:text-[#173B33] dark:hover:text-white cursor-pointer" onClick={() => navigate('/')}>Головна</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[#173B33] dark:text-white font-medium">Кошик</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-[800] font-['Manrope'] text-[#173B33] dark:text-white">Мої кошики</h1>
              <p className="text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mt-1">Керуйте своїми списками покупок та порівнюйте ціни</p>
            </div>
            
            {(!isLoading && carts && carts.length > 0) && (
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 border border-gray-300 dark:border-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] bg-white dark:bg-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-gray-50 dark:hover:bg-[#1D2A25] transition-colors"
                  onClick={() => navigate('/catalog')}
                >
                  Перейти в каталог
                </button>
                <button 
                  className="px-4 py-2 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors disabled:opacity-50"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Створити новий кошик
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Rendering */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#265447] dark:border-b-[#3DAE8B]"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-['Inter']">
            Помилка завантаження даних
          </div>
        ) : !carts || carts.length === 0 ? (
          <div className="bg-white dark:bg-[#111A17] rounded-2xl shadow-sm border border-gray-100 dark:border-[#265447]/30 p-8 min-h-[500px] flex items-center justify-center transition-colors">
            <CartEmptyState onOpenCreateModal={() => setIsCreateModalOpen(true)} />
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

      <CreateCartModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateCart}
        isCreating={isCreating}
      />
    </div>
  );
};
