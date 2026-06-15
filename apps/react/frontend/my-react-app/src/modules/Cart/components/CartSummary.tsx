import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFetchCartDetails } from '../../../hooks/api/useCartApi';

export const CartSummary: React.FC = () => {
  const { activeCartId } = useCartStore();
  const { data: activeCart, isLoading } = useFetchCartDetails(activeCartId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#305C50]"></div>
      </div>
    );
  }

  if (!activeCart) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-gray-900">Підсумок кошика</h2>
      
      {/* Stats */}
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Кількість товарів</span>
          <span className="font-medium">{activeCart.summary.totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Орієнтовна сума</span>
          <span className="font-medium">{activeCart.bestPrice} грн</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Найвигідніший магазин</span>
          <span className="font-medium text-gray-900">{activeCart.bestStore}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-medium text-gray-900">Можлива економія</span>
          <span className="px-2 py-1 bg-[#ffcc00] text-yellow-900 font-bold rounded">
            {activeCart.summary.maxPossibleSavings} грн
          </span>
        </div>
      </div>

      {/* Comparison block */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3 text-sm">Порівняння магазинів</h3>
        <div className="flex flex-col gap-2">
          {activeCart.summary.comparison.map((store) => (
            <div 
              key={store.storeName}
              className={`flex justify-between items-center p-3 rounded-lg border ${
                store.isBest ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-${store.isBest ? 'semibold text-gray-900' : 'medium text-gray-700'}`}>
                  {store.storeName}
                </span>
                {store.isBest && (
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Найкраща ціна
                  </span>
                )}
              </div>
              <span className={`font-${store.isBest ? 'bold text-emerald-700' : 'medium text-gray-700'}`}>
                {store.totalPrice} грн
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <button className="w-full py-3 bg-[#305C50] text-white rounded-lg font-medium hover:bg-[#25473e] transition-colors">
          Зберегти кошик
        </button>
        <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Поділитися кошиком
        </button>
      </div>
      
      <p className="text-xs text-center text-gray-400 mt-2">
        Ціни є орієнтовними і можуть відрізнятися в залежності від обраного магазину
      </p>
    </div>
  );
};
