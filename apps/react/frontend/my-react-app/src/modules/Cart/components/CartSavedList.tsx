import React, { useRef, useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFetchCarts, useDeleteCart } from '../../../hooks/api/useCartApi';
import { MoreHorizontal, Edit2, Share2, Copy, Trash2 } from 'lucide-react';

export const CartSavedList: React.FC = () => {
  const { activeCartId, setActiveCart, openMenuId, setOpenMenuId } = useCartStore();
  const { data: carts = [] } = useFetchCarts();
  const { mutate: deleteCart } = useDeleteCart();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, setOpenMenuId]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-[800] font-['Manrope'] text-[#173B33] mb-2">Збережені кошики</h2>
      <div className="flex flex-col gap-3">
        {carts.map((cart) => (
          <div 
            key={cart.id}
            className={`p-4 rounded-xl border cursor-pointer transition-colors relative ${
              activeCartId === cart.id 
                ? 'bg-[#EAF3EF] border-[#265447]' 
                : 'bg-white border-[#265447]/10 hover:border-[#265447]/30'
            }`}
            onClick={() => setActiveCart(cart.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-[800] font-['Manrope'] text-[#173B33]">{cart.title}</h3>
              <div className="relative" ref={openMenuId === cart.id ? menuRef : null}>
                <button 
                  className="p-1 text-[#6D8279] hover:text-[#265447] rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === cart.id ? null : cart.id);
                  }}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === cart.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-10 overflow-hidden">
                    <button className="w-full text-left px-4 py-2 text-sm text-[#265447] font-['Inter'] hover:bg-gray-50 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Редагувати назву
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-[#265447] font-['Inter'] hover:bg-gray-50 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Поділитися
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-[#265447] font-['Inter'] hover:bg-gray-50 flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Дублювати
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 font-['Inter'] hover:bg-[#ffcc00] hover:text-red-700 hover:font-bold flex items-center gap-2 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCart(cart.id);
                        if (activeCartId === cart.id) setActiveCart(null);
                        setOpenMenuId(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Видалити
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-[#6D8279] font-['Inter'] mb-3">
              {cart.itemsCount} товарів • {new Date(cart.updatedAt).toLocaleDateString('uk-UA')}
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-[#6D8279] font-['Inter'] mb-1">Економія {Number(cart.potentialSavings).toFixed(2)} ₴</div>
                <div className="inline-flex items-center px-2 py-1 bg-[#ffcc00]/20 text-[#173B33] text-xs font-bold rounded">
                  {cart.bestStore}
                </div>
              </div>
              <div className="font-[600] font-['Inter'] text-lg text-[#173B33]">
                {Number(cart.bestPrice).toFixed(2)} ₴
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
