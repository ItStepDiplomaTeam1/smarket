import React, { useRef, useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFetchCarts, useDeleteCart, useDuplicateCart } from '../../../hooks/api/useCartApi';
import { MoreHorizontal, Edit2, Share2, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const CartSavedList: React.FC = () => {
  const { activeCartId, setActiveCart, openMenuId, setOpenMenuId } = useCartStore();
  const { data: carts = [] } = useFetchCarts();
  const { mutate: deleteCart } = useDeleteCart();
  const { mutate: duplicateCart } = useDuplicateCart();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleShare = async (cartId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const url = `${window.location.origin}/cart/${cartId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Мій кошик Smarket', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Посилання скопійовано!');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

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
    <div className="flex flex-col gap-4 bg-white dark:bg-[#111A17] p-4 rounded-2xl border border-gray-100 dark:border-[#265447]/30 transition-colors">
      <div 
        className="flex justify-between items-center cursor-pointer lg:cursor-default"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
      >
        <h2 className="text-xl font-[800] font-['Manrope'] text-[#173B33] dark:text-white">Збережені кошики</h2>
        <button className="lg:hidden p-1 text-[#265447] dark:text-[#3DAE8B]">
          {isOpenMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <div className={`flex flex-col gap-3 ${isOpenMobile ? 'flex' : 'hidden lg:flex'}`}>
        {carts.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter']">
            Немає збережених кошиків
          </div>
        ) : (
          carts.map((cart) => (
            <div 
              key={cart.id}
              className={`p-4 rounded-xl border cursor-pointer transition-colors relative ${
                activeCartId === cart.id 
                  ? 'bg-[#EAF3EF] border-[#265447] dark:bg-[#265447]/30 dark:border-[#3DAE8B]' 
                  : 'bg-white border-[#265447]/10 hover:border-[#265447]/30 dark:bg-[#1D2A25] dark:border-[#265447]/20 dark:hover:border-[#265447]/50'
              }`}
              onClick={() => setActiveCart(cart.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-[800] font-['Manrope'] text-[#173B33] dark:text-white">{cart.title}</h3>
                <div className="relative" ref={openMenuId === cart.id ? menuRef : null}>
                  <button 
                    className="p-1 text-[#6D8279] dark:text-[#A9B6B0] hover:text-[#265447] dark:hover:text-[#3DAE8B] rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === cart.id ? null : cart.id);
                    }}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuId === cart.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1C2723] border border-gray-100 dark:border-[#265447]/50 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-[#265447] dark:text-[#EAF7F2] font-['Inter'] hover:bg-gray-50 dark:hover:bg-[#1D2A25] flex items-center gap-2 transition-colors min-h-[44px]">
                        <Edit2 className="w-4 h-4 text-[#6D8279] dark:text-[#A9B6B0]" /> Редагувати назву
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-[#265447] dark:text-[#EAF7F2] font-['Inter'] hover:bg-gray-50 dark:hover:bg-[#1D2A25] flex items-center gap-2 transition-colors min-h-[44px]"
                        onClick={(e) => handleShare(cart.id, e)}
                      >
                        <Share2 className="w-4 h-4 text-[#6D8279] dark:text-[#A9B6B0]" /> Поділитися
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-[#265447] dark:text-[#EAF7F2] font-['Inter'] hover:bg-gray-50 dark:hover:bg-[#1D2A25] flex items-center gap-2 transition-colors min-h-[44px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCart(cart.id);
                          setOpenMenuId(null);
                        }}
                      >
                        <Copy className="w-4 h-4 text-[#6D8279] dark:text-[#A9B6B0]" /> Дублювати
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 font-['Inter'] hover:bg-[#ffcc00] hover:text-red-700 dark:hover:text-red-300 hover:font-bold flex items-center gap-2 transition-all min-h-[44px]"
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
              
              <div className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mb-3">
                {cart.itemsCount} товарів • {new Date(cart.updatedAt).toLocaleDateString('uk-UA')}
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mb-1">
                    Економія {Number(cart.potentialSavings).toFixed(2)} ₴
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-[#ffcc00]/20 dark:bg-[#ffcc00]/10 text-[#173B33] dark:text-[#ffcc00] text-xs font-bold rounded">
                    {cart.bestStore}
                  </div>
                </div>
                <div className="font-[600] font-['Inter'] text-lg text-[#173B33] dark:text-white">
                  {Number(cart.bestPrice).toFixed(2)} ₴
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
