import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import { type ReceiptResponse, useGetMyReceipts, useDeleteReceipt } from '@/hooks/api/useCartApi';
import { X, Calendar, ShoppingBag, AlertCircle, RefreshCw, ReceiptText, Trash2 } from 'lucide-react';

interface MyReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyReceiptsModal: React.FC<MyReceiptsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { mutate: deleteReceipt } = useDeleteReceipt();
  const { data: receipts, isLoading, isError, error, refetch } = useGetMyReceipts();
  const receiptDetails = useQueries({
    queries: (receipts ?? []).map((receipt) => ({
      queryKey: ['receipt', receipt.share_token],
      queryFn: async (): Promise<ReceiptResponse> => {
        const { data } = await apiClient.get(`/api/v1/cart/receipts/${receipt.share_token}`);
        return data;
      },
      enabled: isOpen,
      staleTime: 60_000,
    })),
  });

  if (!isOpen) return null;

  const handleReceiptClick = (shareToken: string) => {
    onClose();
    navigate(`/receipts/${shareToken}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111A17] rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-[#265447]/30 transition-colors flex flex-col max-h-[85vh] sm:max-h-[75vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#265447]/20 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold font-['Manrope'] text-[#173B33] dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#265447] dark:text-[#3DAE8B]" /> Мої чеки
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1D2A25] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#265447] dark:border-b-[#3DAE8B]"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400 dark:text-red-500 mb-3" />
              <p className="text-gray-700 dark:text-gray-200 mb-2 font-['Inter'] font-medium">
                {error?.message || 'Помилка завантаження чеків'}
              </p>
              <p className="text-xs text-gray-400 dark:text-[#A9B6B0]/50 mb-4 font-['Inter']">
                Спробуйте ще раз або перевірте з'єднання з мережею.
              </p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-semibold hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Спробувати знову
              </button>
            </div>
          ) : !receipts || receipts.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <p className="text-gray-500 dark:text-[#A9B6B0] mb-2 font-['Inter']">
                Ви ще не завершували жодного кошика
              </p>
              <p className="text-xs text-gray-400 dark:text-[#A9B6B0]/50 font-['Inter']">
                Додайте товари у кошик та натисніть «Створити список покупок».
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {receipts.map((receipt, index) => {
                const date = new Date(receipt.created_at).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const detail = receiptDetails[index]?.data;
                const snapshot = detail?.snapshot[0];
                const items = snapshot?.items ?? [];
                return (
                  <div
                    key={receipt.id}
                    onClick={() => handleReceiptClick(receipt.share_token)}
                    className="relative group w-full overflow-hidden rounded-xl bg-[#fffef8] dark:bg-[#18231f] border border-dashed border-[#265447]/35 dark:border-[#3DAE8B]/35 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left font-mono cursor-pointer"
                  >
                    <div className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Ви впевнені, що хочете видалити цей чек?")) {
                            deleteReceipt(receipt.id);
                          }
                        }}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#1D2A25] transition-all cursor-pointer border-none bg-transparent z-10"
                        title="Видалити чек"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-start justify-between gap-2 border-b border-dashed border-[#265447]/25 dark:border-[#3DAE8B]/25 pb-3">
                        <div className="min-w-0 pr-8">
                          <p className="font-bold text-sm text-[#173B33] dark:text-white truncate uppercase">{receipt.store_name}</p>
                          <p className="mt-1 text-[10px] text-[#6D8279] dark:text-[#A9B6B0] flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</p>
                        </div>
                        <ReceiptText className="w-5 h-5 shrink-0 text-[#265447] dark:text-[#3DAE8B] group-hover:opacity-0 transition-opacity" />
                      </div>

                      <div className="py-3 space-y-1.5 text-[11px] text-[#40564d] dark:text-[#c2d0ca]">
                        {receiptDetails[index]?.isPending ? (
                          <div className="h-10 rounded bg-[#265447]/10 dark:bg-[#3DAE8B]/10 animate-pulse" />
                        ) : items.length > 0 ? (
                          <>
                            {items.slice(0, 2).map((item) => (
                              <div key={item.product_id} className="flex gap-2 justify-between">
                                <span className="truncate">{item.name} × {item.quantity}</span>
                                <span className="shrink-0">{Number(item.subtotal).toFixed(2)}</span>
                              </div>
                            ))}
                            {items.length > 2 && <p className="text-[#6D8279] dark:text-[#A9B6B0]">… ще {items.length - 2} товар(и)</p>}
                          </>
                        ) : <p>Склад чека завантажиться при відкритті</p>}
                      </div>

                      <div className="border-t border-dashed border-[#265447]/25 dark:border-[#3DAE8B]/25 pt-3 flex justify-between items-end gap-2">
                        <span className="text-[10px] text-[#6D8279] dark:text-[#A9B6B0]">РАЗОМ</span>
                        <span className="font-bold text-base text-[#265447] dark:text-[#3DAE8B]">{Number(receipt.total_price).toFixed(2)} ₴</span>
                      </div>
                      {receipt.savings_amount > 0 && <p className="mt-2 text-[10px] font-sans font-semibold text-green-700 dark:text-green-400">Економія: {Number(receipt.savings_amount).toFixed(2)} ₴</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
