import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFetchCartDetails, useUpdateCartItem } from '../../../hooks/api/useCartApi';
import { Trash2, Plus, Minus, Image as ImageIcon } from 'lucide-react';

export const CartDetails: React.FC = () => {
  const { activeCartId } = useCartStore();
  const { data: activeCart, isLoading } = useFetchCartDetails(activeCartId);
  const { mutate: updateItem } = useUpdateCartItem();

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
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{activeCart.title}</h2>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Готовий до порівняння
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {activeCart.items.length} товарів • Оновлено {new Date(activeCart.updatedAt).toLocaleDateString('uk-UA')}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeCart.items.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Кошик порожній</div>
        ) : (
          activeCart.items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
              {/* Image Placeholder */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={item.name}>
                  {item.name}
                </h3>
                <div className="text-sm text-gray-500 mb-3">
                  {item.basePrice.toFixed(2)} грн / шт
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      className="p-1 text-gray-500 hover:bg-gray-50 rounded-l-lg disabled:opacity-50"
                      onClick={() => updateItem({ cartId: activeCart.id, productId: item.productId, quantity: Math.max(1, item.quantity - 1) })}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      className="p-1 text-gray-500 hover:bg-gray-50 rounded-r-lg"
                      onClick={() => updateItem({ cartId: activeCart.id, productId: item.productId, quantity: item.quantity + 1 })}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      {item.totalItemPrice.toFixed(2)} грн
                    </span>
                    <button 
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => updateItem({ cartId: activeCart.id, productId: item.productId, quantity: 0 })}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button className="flex items-center gap-2 text-[#305C50] font-medium hover:text-[#25473e] transition-colors">
          <Plus className="w-5 h-5" /> Додати товар
        </button>
        <button 
          className="text-gray-500 font-medium hover:text-red-600 transition-colors"
          onClick={() => {}}
        >
          Очистити кошик
        </button>
      </div>
    </div>
  );
};
