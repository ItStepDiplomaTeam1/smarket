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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold font-['Manrope'] text-[#173B33]">Створити новий кошик</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="cartName" className="block text-sm font-medium font-['Inter'] text-[#6D8279] mb-2">
              Назва кошика
            </label>
            <input
              type="text"
              id="cartName"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder="Наприклад: Закупівля на вихідні"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265447] focus:border-transparent font-['Inter'] text-[#265447]"
              autoFocus
              required
              minLength={2}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium font-['Inter'] text-[#6D8279] hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isCreating || cartName.trim().length < 2}
              className="px-5 py-2.5 bg-[#265447] text-white rounded-xl font-medium font-['Inter'] hover:bg-[#1A3E2F] transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
