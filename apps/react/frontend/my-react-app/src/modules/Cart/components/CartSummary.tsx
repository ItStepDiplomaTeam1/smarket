import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/useCartStore';
import { useFetchCartDetails, useFetchCartComparison, useCompleteCart } from '../../../hooks/api/useCartApi';

export const CartSummary: React.FC = () => {
  const { activeCartId } = useCartStore();
  const navigate = useNavigate();
  const completeMutation = useCompleteCart();
  const { data: activeCart, isLoading: isLoadingCart } = useFetchCartDetails(activeCartId);
  const { data: comparisonData, isLoading: isLoadingComparison } = useFetchCartComparison(activeCartId);

  const handleShare = async () => {
    if (!activeCartId) return;
    const url = `${window.location.origin}/cart/${activeCartId}`;
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

  const handleComplete = async () => {
    if (!activeCartId) return;
    try {
      const receipt = await completeMutation.mutateAsync(activeCartId);
      toast.success('Чек успішно створено!');
      navigate(`/receipts/${receipt.share_token}`);
    } catch (err: any) {
      console.error('Failed to complete cart', err);
      const detail = err?.response?.data?.detail || 'Не вдалося створити список покупок';
      toast.error(detail);
    }
  };

  if (isLoadingCart || isLoadingComparison) {
    return (
      <div className="bg-white dark:bg-[#111A17] rounded-xl border border-gray-200 dark:border-[#265447]/30 p-6 flex items-center justify-center h-[300px] transition-colors">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#305C50] dark:border-b-[#3DAE8B]"></div>
      </div>
    );
  }

  if (!activeCart) return null;

  const bestStore = comparisonData && comparisonData.length > 0 ? comparisonData[0].storeName : activeCart.bestStore;
  const bestPrice = comparisonData && comparisonData.length > 0 ? comparisonData[0].totalPrice : activeCart.bestPrice;
  const comparison = comparisonData || activeCart.summary.comparison;

  const prices = comparisonData ? comparisonData.map((c: any) => c.totalPrice) : [];
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const calculatedSavings = maxPrice > minPrice ? maxPrice - minPrice : 0;
  const savings = comparisonData && comparisonData.length > 0 ? calculatedSavings : activeCart.summary.maxPossibleSavings;

  return (
    <div className="bg-white dark:bg-[#111A17] rounded-xl border border-gray-200 dark:border-[#265447]/30 p-6 flex flex-col gap-6 transition-colors">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Підсумок кошика</h2>
      
      {/* Stats */}
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-[#A9B6B0]">Кількість товарів</span>
          <span className="font-medium dark:text-white">{activeCart.summary.totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-[#A9B6B0]">Орієнтовна сума</span>
          <span className="font-medium dark:text-white">{Number(bestPrice).toFixed(2)} ₴</span>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-gray-500 dark:text-[#A9B6B0] whitespace-nowrap">Найвигідніший магазин</span>
          <span className="font-medium text-gray-900 dark:text-white text-right ml-auto">{bestStore}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-[#265447]/20">
          <span className="font-medium text-gray-900 dark:text-white">Можлива економія</span>
          <span className="px-2 py-1 bg-[#ffcc00] dark:bg-[#ffcc00]/10 text-yellow-900 dark:text-[#ffcc00] font-bold rounded">
            {Number(savings).toFixed(2)} ₴
          </span>
        </div>
      </div>

      {/* Comparison block */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Порівняння магазинів</h3>
        <div className="flex flex-col gap-2">
          {comparison.map((store: any) => (
            <div key={store.storeName} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-[#265447]/20 last:border-0 gap-4">
              <span className="text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] flex-1 truncate" title={store.storeName}>{store.storeName}</span>
              <span className="font-semibold text-[#173B33] dark:text-white font-['Inter'] whitespace-nowrap shrink-0">{Number(store.totalPrice).toFixed(2)} ₴</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between items-end py-4 mb-6 border-t border-gray-100 dark:border-[#265447]/20 gap-4">
        <span className="font-bold font-['Inter'] text-[#173B33] dark:text-white text-lg whitespace-nowrap">Найкраща ціна:</span>
        <div className="text-right ml-auto">
          <div className="font-bold font-['Inter'] text-[#265447] dark:text-[#3DAE8B] text-2xl">{Number(bestPrice).toFixed(2)} ₴</div>
          <div className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mt-1">В {bestStore}</div>
        </div>
      </div>
      
      <button 
        className="w-full py-3 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors mb-3 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleComplete}
        disabled={completeMutation.isPending || (activeCart.summary.totalItems === 0)}
        title={activeCart.summary.totalItems === 0 ? 'Додайте товари до кошика' : undefined}
      >
        {completeMutation.isPending ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-[#111A17]"></div>
        ) : activeCart.summary.totalItems === 0 ? (
          'Кошик порожній'
        ) : (
          'Створити список покупок'
        )}
      </button>
      <button 
        className="w-full py-3 border border-[#265447]/20 dark:border-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] rounded-xl font-medium font-['Inter'] hover:bg-[#F6FAF8] dark:hover:bg-[#1D2A25] transition-colors min-h-[44px]"
        onClick={handleShare}
      >
        Поділитися кошиком
      </button>
      
      <p className="text-xs text-center text-gray-400 dark:text-[#A9B6B0]/60 mt-2">
        Ціни є орієнтовними і можуть відрізнятися в залежності від обраного магазину
      </p>
    </div>
  );
};
