import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMyReceipts } from '@/hooks/api/useCartApi';
import { X, Calendar, ShoppingBag } from 'lucide-react';

interface MyReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyReceiptsModal: React.FC<MyReceiptsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: receipts, isLoading } = useGetMyReceipts();

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
            <div className="flex flex-col gap-3">
              {receipts.map((receipt) => {
                const date = new Date(receipt.created_at).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={receipt.id}
                    onClick={() => handleReceiptClick(receipt.share_token)}
                    className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-[#265447]/20 hover:border-[#265447]/40 dark:hover:border-[#3DAE8B]/40 hover:bg-gray-50 dark:hover:bg-[#1D2A25]/30 transition-all flex justify-between items-center gap-4 group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate font-['Inter']">
                        {receipt.store_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#A9B6B0]/60 mt-1 flex items-center gap-1 font-['Inter']">
                        <Calendar className="w-3.5 h-3.5" /> {date}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-[#265447] dark:text-[#3DAE8B] font-['Inter']">
                        {Number(receipt.total_price).toFixed(2)} ₴
                      </p>
                      {receipt.savings_amount > 0 && (
                        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-0.5 font-['Inter']">
                          Заощаджено: {Number(receipt.savings_amount).toFixed(2)} ₴
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
