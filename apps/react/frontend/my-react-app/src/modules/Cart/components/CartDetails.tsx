import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import {
  useClearCart,
  useDeleteCartItem,
  useFetchCartComparison,
  useFetchCartDetails,
  useUpdateCartItemQuantity,
} from '@/hooks/api/useCartApi';
import mainMilk from '@/shared/assets/milk.svg';

export const CartDetails: React.FC = () => {
  const navigate = useNavigate();
  const activeCartId = useCartStore((state) => state.activeCartId);
  const selectedStoreId = useCartStore((state) =>
    activeCartId ? state.selectedStoreByCart[activeCartId] : undefined
  );
  const { data: activeCart, isLoading } = useFetchCartDetails(activeCartId);
  const { data: comparisonData } = useFetchCartComparison(activeCartId);
  const { mutate: updateQuantity } = useUpdateCartItemQuantity();
  const { mutate: deleteItem } = useDeleteCartItem();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  const completeComparisons =
    comparisonData?.filter((store) => store.isComplete) ?? [];
  const selectedStore =
    completeComparisons.find((store) => store.storeId === selectedStoreId) ??
    completeComparisons[0];
  const selectedPricesByProductId = new Map(
    selectedStore?.itemPrices?.map((item) => [item.productId, item.unitPrice]) ?? []
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#111A17]/40 rounded-xl border border-dashed border-gray-300 dark:border-[#265447]/30 p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#305C50] dark:border-b-[#3DAE8B]"></div>
      </div>
    );
  }

  if (!activeCart) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#111A17]/40 rounded-xl border border-dashed border-gray-300 dark:border-[#265447]/30 p-8 h-full">
        <p className="text-gray-500 dark:text-[#A9B6B0]">Виберіть кошик для перегляду деталей</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111A17] rounded-2xl border border-[#265447]/10 dark:border-[#265447]/30 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-[#265447]/20">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-[800] font-['Manrope'] text-[#173B33] dark:text-white">{activeCart.title}</h2>
          <span className="px-3 py-1 bg-[#EAF3EF] dark:bg-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] text-xs font-bold rounded-full font-['Inter']">
            Готовий до порівняння
          </span>
        </div>
        <div className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter']">
          {activeCart.items.length} товарів • Оновлено {new Date(activeCart.updatedAt).toLocaleDateString('uk-UA')}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {activeCart.items.length === 0 ? (
          <div className="text-center py-10 text-[#6D8279] dark:text-[#A9B6B0] font-['Inter']">Кошик порожній</div>
        ) : (
          activeCart.items.map((item) => {
            const displayedUnitPrice =
              selectedPricesByProductId.get(item.productId) ?? item.basePrice;
            const displayedTotalPrice = displayedUnitPrice * item.quantity;

            return (
            <div key={item.productId} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-[#1D2A25] border border-[#265447]/10 dark:border-[#265447]/20 rounded-xl hover:border-[#265447]/30 dark:hover:border-[#265447]/50 transition-colors items-start sm:items-center">
              {/* Image */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-[#111A17] border border-gray-100 dark:border-[#265447]/15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative p-1 transition-all">
                <img
                  src={item.imageUrl || mainMilk}
                  alt={item.name}
                  className="w-full h-full object-contain relative z-10 mix-blend-multiply dark:mix-blend-normal"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Content Container */}
              <div className="flex flex-col sm:flex-row flex-1 gap-4 sm:gap-6 sm:items-center justify-between min-w-0 w-full">
                
                {/* Top/Left Section: Title & Quantity */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-1 min-w-0 w-full">
                  {/* Title & Base Price */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold font-['Manrope'] text-[#173B33] dark:text-white text-base leading-tight line-clamp-2 mb-1" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter']">
                      {displayedUnitPrice.toFixed(2)} ₴ / шт
                    </div>
                    {selectedStore ? (
                      <div className="mt-1 truncate text-xs text-[#6D8279] dark:text-[#7E968C]" title={selectedStore.storeName}>
                        Ціна в {selectedStore.storeName}
                      </div>
                    ) : null}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#111A17] rounded-lg p-1 border border-gray-100 dark:border-[#265447]/30 shrink-0 self-start sm:self-auto">
                    <button 
                      className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-[#1D2A25] hover:shadow-sm dark:hover:shadow-none transition-all text-[#6D8279] dark:text-[#A9B6B0] hover:text-[#173B33] dark:hover:text-white disabled:opacity-50"
                      onClick={() => updateQuantity({ cartId: activeCart.id, itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium font-['Inter'] text-[#173B33] dark:text-white">{item.quantity}</span>
                    <button 
                      className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-[#1D2A25] hover:shadow-sm dark:hover:shadow-none transition-all text-[#6D8279] dark:text-[#A9B6B0] hover:text-[#173B33] dark:hover:text-white"
                      onClick={() => updateQuantity({ cartId: activeCart.id, itemId: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom/Right Section: Price & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-50 dark:border-[#265447]/10 pt-3 sm:pt-0">
                  <div className="font-bold font-['Manrope'] text-lg text-[#173B33] dark:text-white text-right whitespace-nowrap min-w-[80px]">
                    {displayedTotalPrice.toFixed(2)} ₴
                  </div>
                  <button 
                    className="p-3 text-gray-400 dark:text-[#A9B6B0] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => deleteItem({ cartId: activeCart.id, itemId: item.id })}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 dark:border-[#265447]/20 bg-[#F6FAF8] dark:bg-[#1D2A25]/40 flex justify-between rounded-b-2xl">
        <button 
          className="flex items-center gap-2 text-[#265447] dark:text-[#3DAE8B] font-medium font-['Inter'] hover:text-[#173B33] dark:hover:text-white transition-colors min-h-[44px]"
          onClick={() => navigate('/catalog')}
        >
          <Plus className="w-5 h-5" /> Додати товар
        </button>
        <button 
          className="text-[#6D8279] dark:text-[#A9B6B0] font-medium font-['Inter'] hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 min-h-[44px]"
          onClick={() => clearCart(activeCart.id)}
          disabled={isClearing || activeCart.items.length === 0}
        >
          {isClearing ? 'Очищення...' : 'Очистити кошик'}
        </button>
      </div>
    </div>
  );
};
