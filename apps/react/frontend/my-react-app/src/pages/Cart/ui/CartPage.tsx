import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import { useFetchCarts, useCreateCart, useImportCart } from '@/hooks/api/useCartApi';
import { CartEmptyState } from '@/modules/Cart/components/CartEmptyState';
import { CartSavedList } from '@/modules/Cart/components/CartSavedList';
import { CartDetails } from '@/modules/Cart/components/CartDetails';
import { CartSummary } from '@/modules/Cart/components/CartSummary';
import { CartUnauthState } from '@/modules/Cart/components/CartUnauthState';
import { CreateCartModal } from '@/modules/Cart/components/CreateCartModal';
import { MyReceiptsModal } from '@/modules/Cart/components/MyReceiptsModal';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { ChevronRight, Download, X } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartId } = useParams<{ cartId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { data: carts, isLoading, isError } = useFetchCarts();
  const { mutate: createCart, isPending: isCreating } = useCreateCart();
  const { mutate: importCart, isPending: isImporting } = useImportCart();
  const { activeCartId, setActiveCart } = useCartStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMyReceiptsOpen, setIsMyReceiptsOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    // If we have carts and a cartId parameter is in the URL
    if (carts && cartId) {
      const exists = carts.some(c => c.id === cartId);
      if (exists) {
        setActiveCart(cartId);
        // Silently clear the URL parameter
        navigate('/cart', { replace: true });
      } else {
        setShowImportDialog(true);
      }
    } else if (carts && carts.length > 0 && !activeCartId) {
      // If we have carts and no active cart is selected, select the first one
      setActiveCart(carts[0].id);
    }
  }, [carts, cartId, activeCartId, setActiveCart, navigate]);

  const handleCreateCart = (name: string) => {
    createCart(name, {
      onSuccess: (newCartId) => {
        setActiveCart(newCartId);
        setIsCreateModalOpen(false);
      }
    });
  };

  const handleImportCart = () => {
    if (cartId) {
      importCart(cartId, {
        onSuccess: (data) => {
          setActiveCart(data.new_cart_id);
          setShowImportDialog(false);
          navigate('/cart', { replace: true });
        },
        onError: (err: any) => {
          alert('Не вдалося імпортувати кошик: ' + (err.response?.data?.detail || err.message));
          setShowImportDialog(false);
          navigate('/cart', { replace: true });
        }
      });
    }
  };

  const handleCancelImport = () => {
    setShowImportDialog(false);
    navigate('/cart', { replace: true });
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
            
            <div className="flex gap-3">
              <button 
                className="px-4 py-2 border border-gray-300 dark:border-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] bg-white dark:bg-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-gray-50 dark:hover:bg-[#1D2A25] transition-colors"
                onClick={() => setIsMyReceiptsOpen(true)}
              >
                Мої чеки
              </button>
              {(!isLoading && carts && carts.length > 0) ? (
                <>
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
                </>
              ) : (
                <button 
                  className="px-4 py-2 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Створити новий кошик
                </button>
              )}
            </div>
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
      <MyReceiptsModal
        isOpen={isMyReceiptsOpen}
        onClose={() => setIsMyReceiptsOpen(false)}
      />

      {/* Import Shared Cart Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-[#0B110F]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white dark:bg-[#111A17] rounded-2xl max-w-md w-full border border-gray-100 dark:border-[#265447]/30 shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-[#265447]/10">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#265447] dark:text-[#3DAE8B]" />
                <h3 className="text-lg font-[800] font-['Manrope'] text-[#173B33] dark:text-white">Імпорт кошика</h3>
              </div>
              <button 
                onClick={handleCancelImport}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1D2A25] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] leading-relaxed">
                Вам надіслали посилання на спільний список покупок. Бажаєте імпортувати його копію до свого профілю?
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#1D2A25]/50 flex justify-end gap-3 border-t border-gray-100 dark:border-[#265447]/10">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 text-sm font-medium font-['Inter'] text-[#6D8279] dark:text-[#A9B6B0] hover:text-[#173B33] dark:hover:text-white transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleImportCart}
                disabled={isImporting}
                className="px-5 py-2.5 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl text-sm font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Імпортувати кошик
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
