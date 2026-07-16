import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetReceipt } from '@/hooks/api/useCartApi';
import toast from 'react-hot-toast';
import { MapPin, Share2, Check, ArrowLeft } from 'lucide-react';

const ReceiptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: receipt, isLoading, refetch } = useGetReceipt(token || '');
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (receipt && !receipt.ai_description && !retried) {
      const timer = setTimeout(() => {
        refetch();
        setRetried(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [receipt, retried, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0F0D] py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#265447] dark:border-b-[#3DAE8B]"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0A0F0D] py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Чек не знайдено</h2>
        <p className="text-gray-500 dark:text-[#A9B6B0] mb-6">Можливо, посилання застаріло або неправильне.</p>
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 px-6 py-2 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад до кошика
        </button>
      </div>
    );
  }

  const snapshotStore = receipt.snapshot[0];
  const hasCoordinates = snapshotStore?.lat && snapshotStore?.lng;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${snapshotStore.lat},${snapshotStore.lng}`
    : '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Чек Smarket — ${snapshotStore?.store_name || ''}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Посилання скопійовано в буфер обміну!');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleMarkAsBought = () => {
    toast.success('Покупки успішно завершено!');
    navigate('/cart');
  };

  const formattedDate = new Date(receipt.created_at).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0F0D] py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Status */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-[#265447] dark:text-[#3DAE8B] font-medium font-['Inter'] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> До кошика
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-[#A9B6B0]/60">{formattedDate}</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
              Архівно
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-[#111A17] rounded-2xl border border-gray-200 dark:border-[#265447]/30 p-8 text-center shadow-sm transition-colors">
          <p className="text-sm font-medium text-gray-500 dark:text-[#A9B6B0] mb-1">Ви заощадили</p>
          <h1 className="text-4xl font-extrabold text-[#265447] dark:text-[#3DAE8B] font-['Inter'] mb-2">
            {Number(receipt.savings_amount).toFixed(2)} ₴
          </h1>
          <p className="text-xs text-gray-400 dark:text-[#A9B6B0]/50">
            у порівнянні з іншими пропозиціями магазинів
          </p>
        </div>

        {/* AI Note block */}
        {receipt.ai_description ? (
          <div className="bg-[#f0fdf4] dark:bg-[#162a22] border-l-4 border-[#265447] dark:border-[#3DAE8B] p-5 rounded-r-xl transition-all duration-300">
            <h3 className="text-xs font-bold text-[#265447] dark:text-[#3DAE8B] uppercase tracking-wider mb-2 font-['Inter']">
              AI Коментар від Промінь
            </h3>
            <p className="text-sm italic text-gray-700 dark:text-gray-200 leading-relaxed font-['Inter']">
              « {receipt.ai_description} »
            </p>
          </div>
        ) : !retried ? (
          <div className="bg-[#f0fdf4]/50 dark:bg-[#162a22]/50 border-l-4 border-gray-300 dark:border-gray-700 p-5 rounded-r-xl animate-pulse">
            <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ) : null}

        {/* Receipt Snapshot Card */}
        {snapshotStore && (
          <div className="bg-white dark:bg-[#111A17] rounded-2xl border border-gray-200 dark:border-[#265447]/30 shadow-sm overflow-hidden transition-colors">
            
            {/* Store Information */}
            <div className="p-6 bg-gray-50/50 dark:bg-[#15231F]/30 border-b border-gray-200 dark:border-[#265447]/20 flex justify-between items-start flex-wrap gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Обраний магазин
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {snapshotStore.store_name}
                </h2>
                {snapshotStore.address && (
                  <p className="text-sm text-gray-500 dark:text-[#A9B6B0] mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {snapshotStore.address}
                  </p>
                )}
              </div>
              
              {hasCoordinates && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-[#265447]/30 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-red-500" /> Прокласти маршрут
                </a>
              )}
            </div>

            {/* List of items */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Список покупок</h3>
              <div className="divide-y divide-gray-100 dark:divide-[#265447]/20">
                {snapshotStore.items.map((item) => (
                  <div key={item.product_id} className="py-4 flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#A9B6B0]/60 mt-0.5">
                        {item.quantity} шт. × {Number(item.price).toFixed(2)} ₴
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      {item.in_stock ? (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {Number(item.subtotal).toFixed(2)} ₴
                        </p>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded">
                          Немає в наявності
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total price */}
              <div className="pt-6 border-t border-gray-100 dark:border-[#265447]/20 flex justify-between items-center mt-6">
                <span className="font-bold text-[#173B33] dark:text-white text-lg">Загальна сума:</span>
                <span className="font-extrabold text-[#265447] dark:text-[#3DAE8B] text-2xl">
                  {Number(receipt.total_price).toFixed(2)} ₴
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={handleMarkAsBought}
            className="flex-1 py-3 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-bold hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Позначити як куплено
          </button>
          
          <button
            onClick={handleShare}
            className="px-6 py-3 border border-[#265447]/20 dark:border-[#265447]/30 text-[#265447] dark:text-[#3DAE8B] rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#1D2A25] transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" /> Поділитися
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReceiptPage;
