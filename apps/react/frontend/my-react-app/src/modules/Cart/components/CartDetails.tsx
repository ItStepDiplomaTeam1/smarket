import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useFetchCartDetails, useUpdateCartItem, useClearCart, useUpdateCartItemQuantity, useDeleteCartItem } from '../../../hooks/api/useCartApi';
import { Trash2, Plus, Minus } from 'lucide-react';
import mainMilk from '@/shared/assets/milk.svg';

export const CartDetails: React.FC = () => {
  const navigate = useNavigate();
  const { activeCartId } = useCartStore();
  const { data: activeCart, isLoading } = useFetchCartDetails(activeCartId);
  const { mutate: updateItem } = useUpdateCartItem();
  const { mutate: updateQuantity } = useUpdateCartItemQuantity();
  const { mutate: deleteItem } = useDeleteCartItem();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#305C50]"></div>
      </div>
    );
  }

  if (!activeCart) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 h-full">
        <p className="text-gray-500">Виберіть кошик для перегляду деталей</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#265447]/10 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-[800] font-['Manrope'] text-[#173B33]">{activeCart.title}</h2>
          <span className="px-3 py-1 bg-[#EAF3EF] text-[#265447] text-xs font-bold rounded-full font-['Inter']">
            Готовий до порівняння
          </span>
        </div>
        <div className="text-sm text-[#6D8279] font-['Inter']">
          {activeCart.items.length} товарів • Оновлено {new Date(activeCart.updatedAt).toLocaleDateString('uk-UA')}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {activeCart.items.length === 0 ? (
          <div className="text-center py-10 text-[#6D8279] font-['Inter']">Кошик порожній</div>
        ) : (
          activeCart.items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 bg-white border border-[#265447]/10 rounded-xl hover:border-[#265447]/30 transition-colors items-start xl:items-center">
              {/* Image */}
              <div className="w-24 h-24 lg:w-32 lg:h-32 xl:w-14 xl:h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative p-1 transition-all">
                <img
                  src={item.imageUrl || mainMilk}
                  alt={item.name}
                  className="w-full h-full object-contain relative z-10 mix-blend-multiply"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Content Container */}
              <div className="flex flex-col xl:flex-row flex-1 gap-4 xl:gap-6 xl:items-center justify-between min-w-0">
                
                {/* Top/Left Section: Title & Quantity */}
                <div className="flex justify-between items-start xl:items-center gap-4 xl:flex-1 min-w-0">
                  {/* Title & Base Price */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold font-['Manrope'] text-[#173B33] text-base leading-tight line-clamp-2 mb-1" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="text-sm text-[#6D8279] font-['Inter']">
                      {item.basePrice.toFixed(2)} ₴ / шт
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 xl:gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100 shrink-0">
                    <button 
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-[#6D8279] hover:text-[#173B33] disabled:opacity-50"
                      onClick={() => updateQuantity({ cartId: activeCart.id, itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium font-['Inter'] text-[#173B33]">{item.quantity}</span>
                    <button 
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-[#6D8279] hover:text-[#173B33]"
                      onClick={() => updateQuantity({ cartId: activeCart.id, itemId: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom/Right Section: Price & Delete */}
                <div className="flex items-center gap-4 justify-end shrink-0">
                  <div className="font-bold font-['Manrope'] text-lg text-[#173B33] text-right whitespace-nowrap min-w-[80px]">
                    {item.totalItemPrice.toFixed(2)} ₴
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    onClick={() => deleteItem({ cartId: activeCart.id, itemId: item.id })}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 bg-[#F6FAF8] flex justify-between rounded-b-2xl">
        <button 
          className="flex items-center gap-2 text-[#265447] font-medium font-['Inter'] hover:text-[#173B33] transition-colors"
          onClick={() => navigate('/catalog')}
        >
          <Plus className="w-5 h-5" /> Додати товар
        </button>
        <button 
          className="text-[#6D8279] font-medium font-['Inter'] hover:text-red-600 transition-colors disabled:opacity-50"
          onClick={() => clearCart(activeCart.id)}
          disabled={isClearing || activeCart.items.length === 0}
        >
          {isClearing ? 'Очищення...' : 'Очистити кошик'}
        </button>
      </div>
    </div>
  );
};
