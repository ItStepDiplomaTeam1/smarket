import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const CartEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Порожній стан</h2>
      <p className="text-gray-500 mb-4 font-medium">У вас ще немає збережених кошиків</p>
      
      <p className="text-gray-400 max-w-md mb-8 text-sm">
        Створіть перший список покупок, щоб порівняти ціни між магазинами та побачити, де вся покупка буде дешевшою
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button className="px-6 py-3 bg-[#305C50] text-white rounded-lg font-medium hover:bg-[#25473e] transition-colors w-full sm:w-auto">
          Створити кошик
        </button>
        <button className="px-6 py-3 border border-[#305C50] text-[#305C50] rounded-lg font-medium hover:bg-[#305C50] hover:text-white transition-colors w-full sm:w-auto">
          Перейти в каталог
        </button>
      </div>
    </div>
  );
};
