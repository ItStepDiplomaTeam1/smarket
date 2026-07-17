import React, { useState } from 'react';

interface CreateCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isCreating: boolean;
}

export const CreateCartModal: React.FC<CreateCartModalProps> = ({ isOpen, onClose, onSubmit, isCreating }) => {
  const [cartName, setCartName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartName.trim().length >= 2) {
      onSubmit(cartName.trim());
      setCartName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111A17] rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-[#265447]/30 transition-colors animate-modal-scale-up">
        <div className="p-6 border-b border-gray-100 dark:border-[#265447]/20">
          <h3 className="text-xl font-bold font-['Manrope'] text-[#173B33] dark:text-white">Створити новий кошик</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="cartName" className="block text-sm font-medium font-['Inter'] text-[#6D8279] dark:text-[#A9B6B0] mb-2">
              Назва кошика
            </label>
            <input
              type="text"
              id="cartName"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder="Наприклад: Закупівля на вихідні"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#265447]/30 bg-white dark:bg-[#1D2A25] focus:outline-none focus:ring-2 focus:ring-[#265447] dark:focus:ring-[#3DAE8B] focus:border-transparent font-['Inter'] text-[#265447] dark:text-white placeholder:text-[#6D8279]/50 dark:placeholder:text-[#A9B6B0]/30 transition-colors"
              autoFocus
              required
              minLength={2}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium font-['Inter'] text-[#6D8279] dark:text-[#A9B6B0] hover:bg-gray-50 dark:hover:bg-[#1D2A25] transition-colors min-h-[44px]"
              disabled={isCreating}
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isCreating || cartName.trim().length < 2}
              className="px-5 py-2.5 bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {isCreating ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
