import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '@/modules/Cart/store/useCartStore';
import {
  useCompleteCart,
  useFetchCartComparison,
  useFetchCartDetails,
} from '@/hooks/api/useCartApi';

export const CartSummary: React.FC = () => {
  const activeCartId = useCartStore((state) => state.activeCartId);
  const selectedStoreByCart = useCartStore((state) => state.selectedStoreByCart);
  const setSelectedStore = useCartStore((state) => state.setSelectedStore);
  const clearSelectedStore = useCartStore((state) => state.clearSelectedStore);
  const navigate = useNavigate();
  const completeMutation = useCompleteCart();
  const { data: activeCart, isLoading: isLoadingCart } = useFetchCartDetails(activeCartId);
  const { data: comparisonData, isLoading: isLoadingComparison } = useFetchCartComparison(activeCartId);
  const completeComparisons = comparisonData?.filter((store) => store.isComplete) ?? [];
  const selectedStoreId = activeCartId
    ? selectedStoreByCart[activeCartId]
    : undefined;
  const selectedStore =
    completeComparisons.find((store) => store.storeId === selectedStoreId) ??
    completeComparisons[0];

  const handleShare = async () => {
    if (!activeCartId) return;
    const url = `${window.location.origin}/cart/shared/${activeCartId}`;
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
    if (!activeCartId || !selectedStore) return;
    try {
      const receipt = await completeMutation.mutateAsync({
        cartId: activeCartId,
        storeId: selectedStore.storeId,
      });
      clearSelectedStore(activeCartId);
      toast.success('Чек успішно створено!');
      navigate(`/receipts/${receipt.share_token}`);
    } catch (err: unknown) {
      console.error('Failed to complete cart', err);
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Не вдалося створити список покупок'
        : 'Не вдалося створити список покупок';
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

  const hasCompleteStore = completeComparisons.length > 0;
  const selectedStoreName = selectedStore?.storeName ?? 'Немає повного набору';
  const selectedPrice = selectedStore?.totalPrice ?? 0;
  const comparison = comparisonData || activeCart.summary.comparison;

  const prices = completeComparisons.map((store) => store.totalPrice);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const calculatedSavings = selectedStore
    ? Math.max(0, maxPrice - selectedStore.totalPrice)
    : 0;
  const savings = comparisonData
    ? calculatedSavings
    : activeCart.summary.maxPossibleSavings;

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
          <span className="font-medium dark:text-white">{Number(selectedPrice).toFixed(2)} ₴</span>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-gray-500 dark:text-[#A9B6B0] whitespace-nowrap">Обраний магазин</span>
          <span className="font-medium text-gray-900 dark:text-white text-right ml-auto">{selectedStoreName}</span>
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
        <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">Оберіть магазин</h3>
        <p className="mb-3 text-xs text-[#6D8279] dark:text-[#A9B6B0]">
          Чек буде сформовано за цінами обраного магазину
        </p>
        <div className="flex flex-col gap-2">
          {comparison.map((store) => {
            const isComplete = store.isComplete !== false;
            const isSelected = store.storeId === selectedStore?.storeId;

            return (
              <label
                key={store.storeId}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                  isSelected
                    ? "border-[#265447] bg-[#F1F7F4] dark:border-[#3DAE8B] dark:bg-[#3DAE8B]/10"
                    : "border-gray-200 dark:border-[#265447]/30",
                  isComplete
                    ? "cursor-pointer hover:border-[#265447]/60 dark:hover:border-[#3DAE8B]/60"
                    : "cursor-not-allowed opacity-60",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`cart-store-${activeCartId}`}
                  value={store.storeId}
                  checked={isSelected}
                  disabled={!isComplete}
                  onChange={() => {
                    if (activeCartId) {
                      setSelectedStore(activeCartId, store.storeId);
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-[#265447] dark:accent-[#3DAE8B]"
                />
                <span className="min-w-0 flex-1 text-[#6D8279] dark:text-[#A9B6B0] font-['Inter']">
                  <span className="block truncate font-medium text-gray-900 dark:text-white" title={store.storeName}>
                    {store.storeName}
                  </span>
                  {store.address && (
                    <span className="block truncate text-xs" title={store.address}>
                      {store.address}
                    </span>
                  )}
                  {!isComplete && (
                    <span className="block text-xs text-amber-700 dark:text-amber-400">
                      Немає {store.missingItemsCount ?? 0} товарів
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block whitespace-nowrap font-semibold text-[#173B33] dark:text-white font-['Inter']">
                    {Number(store.totalPrice).toFixed(2)} ₴
                  </span>
                  {isSelected && (
                    <span className="text-xs font-medium text-[#265447] dark:text-[#3DAE8B]">
                      Обрано
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between items-end py-4 mb-6 border-t border-gray-100 dark:border-[#265447]/20 gap-4">
        <span className="font-bold font-['Inter'] text-[#173B33] dark:text-white text-lg whitespace-nowrap">До сплати:</span>
        <div className="text-right ml-auto">
          <div className="font-bold font-['Inter'] text-[#265447] dark:text-[#3DAE8B] text-2xl">{Number(selectedPrice).toFixed(2)} ₴</div>
          <div className="text-sm text-[#6D8279] dark:text-[#A9B6B0] font-['Inter'] mt-1">В {selectedStoreName}</div>
        </div>
      </div>
      
      <button 
        className="w-full py-3 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors mb-3 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleComplete}
        disabled={completeMutation.isPending || activeCart.summary.totalItems === 0 || !hasCompleteStore}
        title={
          activeCart.summary.totalItems === 0
            ? 'Додайте товари до кошика'
            : !hasCompleteStore
              ? 'Жоден магазин не має всіх товарів'
              : undefined
        }
      >
        {completeMutation.isPending ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-[#111A17]"></div>
        ) : activeCart.summary.totalItems === 0 ? (
          'Кошик порожній'
        ) : !hasCompleteStore ? (
          'Немає повного набору'
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
