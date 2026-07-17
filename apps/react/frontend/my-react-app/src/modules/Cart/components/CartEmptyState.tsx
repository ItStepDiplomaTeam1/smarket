import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface CartEmptyStateProps {
  onOpenCreateModal: () => void;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({ onOpenCreateModal }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-[#1D2A25] rounded-full flex items-center justify-center mb-6 transition-colors">
        <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-[#A9B6B0]" />
      </div>
      
      <h2 className="text-2xl font-semibold font-['Manrope'] text-[#173B33] dark:text-white mb-2">Порожній стан</h2>
      <p className="text-[#6D8279] dark:text-[#A9B6B0] mb-4 font-medium font-['Inter']">У вас ще немає збережених кошиків</p>
      
      <p className="text-[#6D8279] dark:text-[#A9B6B0]/80 max-w-md mb-8 text-sm font-['Inter']">
        Створіть перший список покупок, щоб порівняти ціни між магазинами та побачити, де вся покупка буде дешевшою
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          className="px-6 py-3 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors w-full sm:w-auto min-h-[44px]"
          onClick={onOpenCreateModal}
        >
          Створити кошик
        </button>
        <button 
          className="px-6 py-3 border border-[#305C50] dark:border-[#3DAE8B]/40 text-[#305C50] dark:text-[#3DAE8B] rounded-lg font-medium hover:bg-[#305C50] hover:text-white dark:hover:bg-[#1D2A25] transition-colors w-full sm:w-auto min-h-[44px]"
          onClick={() => navigate('/catalog')}
        >
          Перейти в каталог
        </button>
      </div>
    </div>
  );
};

