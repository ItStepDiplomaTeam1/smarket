import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldPass: string, newPass: string) => Promise<void>;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Нові паролі не співпадають');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Пароль має містити щонайменше 8 символів');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Помилка зміни пароля');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-textMain">Зміна пароля</h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-md text-textMuted hover:bg-bgMain hover:text-textMain transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-textMain">Успішно!</p>
                <p className="text-sm text-textMuted">Пароль було змінено.</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-2">Поточний пароль</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full h-[42px] px-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Введіть поточний пароль"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-2">Новий пароль</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-[42px] px-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Введіть новий пароль"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-2">Підтвердження пароля</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[42px] px-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Повторіть новий пароль"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-semibold text-textMain bg-bgMain hover:bg-border rounded-lg transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Збереження...' : 'Зберегти пароль'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
