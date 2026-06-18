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
            <div key={store.storeName} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-[#6D8279] font-['Inter']">{store.storeName}</span>
              <span className="font-semibold text-[#173B33] font-['Inter']">{store.totalPrice} ₴</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center py-4 mb-6 border-t border-gray-100">
        <span className="font-bold font-['Inter'] text-[#173B33] text-lg">Найкраща ціна:</span>
        <div className="text-right">
          <div className="font-bold font-['Inter'] text-[#265447] text-2xl">{activeCart.bestPrice} ₴</div>
          <div className="text-xs text-[#6D8279] font-['Inter'] mt-1">В {activeCart.bestStore}</div>
        </div>
      </div>
      
      <button className="w-full py-3 bg-[#265447] text-white rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] transition-colors mb-3">
        Створити список покупок
      </button>
      <button className="w-full py-3 border border-[#265447]/20 text-[#265447] rounded-xl font-medium font-['Inter'] hover:bg-[#F6FAF8] transition-colors">
        Поділитися кошиком
      </button>
      
      <p className="text-xs text-center text-gray-400 mt-2">
        Ціни є орієнтовними і можуть відрізнятися в залежності від обраного магазину
      </p>
    </div>
  );
};
