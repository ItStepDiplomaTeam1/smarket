import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import { type ReceiptResponse, type ReceiptListItem, useDeleteReceipt } from '@/hooks/api/useCartApi';
import { Calendar, AlertCircle, ReceiptText, Sparkles, Trash2 } from 'lucide-react';

interface ReceiptsDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReceiptsDropdown: React.FC<ReceiptsDropdownProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { mutate: deleteReceipt } = useDeleteReceipt();

    // Fetch list of receipts, enabled only when dropdown is open
    const { data: receipts, isLoading, isError, error } = useQuery<ReceiptListItem[], Error>({
        queryKey: ['my-receipts'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/v1/cart/receipts');
            return data;
        },
        enabled: isOpen,
    });

    const displayedReceipts = (receipts ?? []).slice(0, 5);

    // Fetch details for the top 5 receipts in parallel
    const receiptDetails = useQueries({
        queries: displayedReceipts.map((receipt) => ({
            queryKey: ['receipt', receipt.share_token],
            queryFn: async (): Promise<ReceiptResponse> => {
                const { data } = await apiClient.get(`/api/v1/cart/receipts/${receipt.share_token}`);
                return data;
            },
            enabled: isOpen,
            staleTime: 60_000,
        })),
    });

    const handleReceiptClick = (shareToken: string) => {
        onClose();
        navigate(`/receipts/${shareToken}`);
    };

    return (
        <div 
            className={`absolute right-0 mt-3 w-[320px] bg-white dark:bg-[#14221E] rounded-2xl border border-[rgba(38,84,71,0.10)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(23,59,51,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-200 origin-top-right ${
                isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[#265447] dark:text-[#3DAE8B]">
                        <ReceiptText className="w-4 h-4" />
                    </span>
                    <span className="text-[14px] font-bold text-[#111827] dark:text-white">Мої чеки</span>
                    {receipts && receipts.length > 0 && (
                        <span className="text-[11px] font-semibold text-[#6D8279] dark:text-[#7A8D85]">
                            ({receipts.length})
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="py-8 text-center flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#265447] dark:border-b-[#3DAE8B]"></div>
                </div>
            ) : isError ? (
                <div className="py-8 px-4 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-[13px] text-red-600 dark:text-red-400 m-0 font-medium">
                        {error?.message || 'Помилка завантаження'}
                    </p>
                </div>
            ) : displayedReceipts.length === 0 ? (
                <div className="py-8 px-4 text-center">
                    <div className="text-[#D1D5DB] dark:text-[#2B4236] mb-3">
                        <ReceiptText className="w-10 h-10 mx-auto opacity-40" />
                    </div>
                    <p className="text-[13px] text-[#9CA3AF] dark:text-[#7A8D85] m-0">Ви ще не завершували жодного кошика</p>
                    <p className="text-[12px] text-[#C0CCC7] dark:text-[#4A5D54] m-0 mt-1">Додайте товари у кошик та натисніть «Створити список покупок»</p>
                </div>
            ) : (
                <ul className="py-1 max-h-[380px] overflow-y-auto m-0 p-0 list-none divide-y divide-[rgba(38,84,71,0.06)] dark:divide-[rgba(255,255,255,0.04)]">
                    {displayedReceipts.map((receipt, index) => {
                        const date = new Date(receipt.created_at).toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        const detail = receiptDetails[index]?.data;
                        const snapshot = detail?.snapshot[0];
                        const items = snapshot?.items ?? [];
                        const isDetailPending = receiptDetails[index]?.isPending;

                        return (
                            <li 
                                key={receipt.id} 
                                onClick={() => handleReceiptClick(receipt.share_token)}
                                className="px-4 py-3 hover:bg-[#F6FAF8] dark:hover:bg-[#1A2E25] transition-colors cursor-pointer group flex items-start gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-[#111827] dark:text-white truncate m-0 uppercase leading-snug">
                                                {receipt.store_name}
                                            </p>
                                            <p className="text-[10px] text-[#6D8279] dark:text-[#A4B3AF] m-0 mt-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {date}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[13px] font-extrabold text-[#265447] dark:text-[#3DAE8B] m-0 leading-snug">
                                                {Number(receipt.total_price).toFixed(2)} ₴
                                            </p>
                                            {receipt.savings_amount > 0 && (
                                                <p className="text-[9px] font-semibold text-green-600 dark:text-green-400 m-0 mt-0.5 flex items-center gap-0.5 justify-end">
                                                    <Sparkles className="w-2.5 h-2.5" /> -{Number(receipt.savings_amount).toFixed(0)} ₴
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items mini list preview */}
                                    <div className="mt-2 text-[11px] text-[#40564d] dark:text-[#c2d0ca] font-mono space-y-0.5">
                                        {isDetailPending ? (
                                            <div className="h-3.5 bg-gray-100 dark:bg-[#1a2c24] rounded animate-pulse w-3/4" />
                                        ) : items.length > 0 ? (
                                            <>
                                                {items.slice(0, 2).map((item) => (
                                                    <div key={item.product_id} className="flex justify-between gap-2">
                                                        <span className="truncate">• {item.name}</span>
                                                        <span className="shrink-0 text-gray-400">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {items.length > 2 && (
                                                    <p className="text-[#6D8279] dark:text-[#7A8D85] m-0 text-[10px] italic">
                                                        … ще {items.length - 2} товар(и)
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="m-0 text-gray-400 italic">Склад чека завантажується...</p>
                                        )}
                                    </div>
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Ви впевнені, що хочете видалити цей чек?')) {
                                            deleteReceipt(receipt.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-950/30 text-[#9CA3AF] hover:text-[#E11D48] transition-all cursor-pointer bg-transparent border-none shrink-0 self-center"
                                    title="Видалити чек"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Bottom Footer Link */}
            {receipts && receipts.length > 5 && (
                <div className="px-4 py-2 border-t border-[rgba(38,84,71,0.08)] dark:border-[rgba(255,255,255,0.08)] text-center bg-[#F6FAF8]/50 dark:bg-[#182622]/30">
                    <button
                        onClick={() => { onClose(); navigate('/cart'); }}
                        className="text-[11px] font-semibold text-[#265447] dark:text-[#3DAE8B] hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                        Показати всі чеки ({receipts.length})
                    </button>
                </div>
            )}
        </div>
    );
};
