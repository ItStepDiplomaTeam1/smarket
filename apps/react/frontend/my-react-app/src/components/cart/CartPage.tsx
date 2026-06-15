import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { CartEmptyState } from './CartEmptyState';
import { CartSavedList } from './CartSavedList';
import { CartDetails } from './CartDetails';
import { CartSummary } from './CartSummary';
import { ChevronRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { carts } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar placeholder - assuming it's part of the global layout, 
          but adding a top spacing just in case */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span className="hover:text-gray-900 cursor-pointer">Головна</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Кошик</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Мої кошики</h1>
              <p className="text-gray-500 mt-1">Керуйте своїми списками покупок та порівнюйте ціни</p>
            </div>
            
            {carts.length > 0 && (
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Перейти в каталог
                </button>
                <button className="px-4 py-2 bg-[#305C50] text-white rounded-lg font-medium hover:bg-[#25473e] transition-colors">
                  Створити новий кошик
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Rendering */}
        {carts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex items-center justify-center">
            <CartEmptyState />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Saved Carts List */}
            <div className="lg:col-span-3">
              <CartSavedList />
            </div>
            
            {/* Column 2: Cart Details */}
            <div className="lg:col-span-6 h-[800px]">
              <CartDetails />
            </div>
            
            {/* Column 3: Cart Summary */}
            <div className="lg:col-span-3">
              <CartSummary />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
