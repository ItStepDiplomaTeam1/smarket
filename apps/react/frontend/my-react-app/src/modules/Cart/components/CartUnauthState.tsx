import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CartUnauthState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh] bg-[#F6FAF8] rounded-2xl border border-[#265447]/10">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#265447]/10">
        <ShoppingCart className="w-10 h-10 text-[#265447]" />
      </div>
      
      <h2 className="text-3xl font-[800] font-['Manrope'] text-[#173B33] mb-3">Ваш кошик</h2>
      <p className="text-[#6D8279] font-['Inter'] text-lg max-w-md mb-8">
        Увійдіть, щоб створювати списки покупок та порівнювати ціни між магазинами
      </p>
      
      <button 
        onClick={() => navigate('/auth')}
        className="px-8 py-3 bg-[#265447] text-white rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] transition-colors"
      >
        Перейти до кошика
      </button>
    </div>
  );
};
