import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
} from 'lucide-react';
import CartIcon from '@/assets/ProfileIcons/Cart.svg';
import ReviewIcon from '@/assets/ProfileIcons/Review.svg';
import TimeIcon from '@/assets/ProfileIcons/Time.svg';
import { useUsers, useBlockUser, useUnblockUser } from '@/hooks/useUsers';
import toast from 'react-hot-toast';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError } = useUsers();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const user = users.find((u) => u.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A65F2]" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-2xl max-w-md mx-auto mt-12">
        <ShieldAlert size={40} className="text-accentRed mx-auto mb-3 opacity-80" />
        <h2 className="text-lg font-bold text-textMain mb-2">Користувача не знайдено</h2>
        <p className="text-sm text-textMuted mb-6">
          Не вдалося знайти інформацію про користувача з ID: {id}
        </p>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 bg-[#1A65F2] text-white rounded-xl text-sm font-medium hover:bg-[#1553c7] transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Назад до списку
        </button>
      </div>
    );
  }

  const isBlocked = user.status === 'Неактивний' || user.status === 'Заблокований';

  const handleToggleBlock = () => {
    if (isBlocked) {
      unblockUser(user.id, {
        onSuccess: () => toast.success('Користувача успішно розблоковано'),
        onError: () => toast.error('Помилка при розблокуванні користувача'),
      });
    } else {
      if (confirm(`Ви впевнені, що хочете заблокувати користувача "${user.name}"?`)) {
        blockUser(user.id, {
          onSuccess: () => toast.success('Користувача успішно заблоковано'),
          onError: () => toast.error('Помилка при блокуванні користувача'),
        });
      }
    }
  };

  // initials
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '14.05.2026';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return '14.05.2026';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 px-4 md:px-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-textMuted uppercase tracking-wider">
        <span className="cursor-pointer hover:text-textMain" onClick={() => navigate('/')}>Головна</span>
        <span className="text-textMuted/60 font-normal">/</span>
        <span className="cursor-pointer hover:text-textMain" onClick={() => navigate('/clients')}>Користувачі</span>
        <span className="text-textMuted/60 font-normal">/</span>
        <span className="text-textMain">Профіль користувача</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 bg-surface hover:bg-secondary border border-border/80 rounded-xl text-textMuted hover:text-textMain transition-colors"
          title="Назад до списку"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-manrope text-[24px] md:text-[28px] font-bold text-textMain leading-tight">Профіль користувача</h1>
          <p className="text-xs md:text-sm text-textMuted mt-0.5">Детальна інформація про користувача</p>
        </div>
      </div>

      {/* Profile Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main info card */}
        <div className="lg:col-span-2 bg-surface border border-border/70 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {/* Avatar container */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-border/50 shrink-0 bg-secondary flex items-center justify-center text-3xl font-bold text-textMuted/80 shadow-inner">
            <span className="select-none">{initials}</span>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-4 text-center md:text-left min-w-0 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-textMain truncate leading-tight">{user.name}</h2>
              <span className={`inline-flex self-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                isBlocked
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                  : 'bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2]/15 dark:text-[#06513C]'
              }`}>
                {user.status}
              </span>
            </div>

            <div className="space-y-2.5 text-sm text-textMuted">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Mail size={16} className="shrink-0 text-textMuted/70" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Phone size={16} className="shrink-0 text-textMuted/70" />
                <span>+38 (050) 777 23 45</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <MapPin size={16} className="shrink-0 text-textMuted/70" />
                <span>Львів, Україна</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Calendar size={16} className="shrink-0 text-textMuted/70" />
                <span>Зареєстрований: {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right actions card */}
        <div className="bg-surface border border-border/70 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-sm font-bold text-textMain uppercase tracking-wider mb-2">Дії</h3>
          
          <button
            onClick={() => toast.success('Надсилання повідомлення заблоковано в демо-режимі')}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm text-textMain border border-border hover:bg-secondary rounded-xl transition-all"
          >
            <Mail size={18} className="text-textMuted" />
            <span>Надіслати повідомлення</span>
          </button>

          <button
            onClick={handleToggleBlock}
            disabled={isBlocking || isUnblocking}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 text-sm rounded-xl border transition-all disabled:opacity-50 ${
              isBlocked 
                ? 'text-[#1e8e3e] border-[#e6f4ea] hover:bg-[#e6f4ea]/30' 
                : 'text-[#c00000] border-red-100 hover:bg-red-50/30'
            }`}
          >
            <ShieldAlert size={18} />
            <span>{isBlocked ? 'Розблокувати користувача' : 'Заблокувати користувача'}</span>
          </button>

          <div className="text-[11px] text-textMuted/70 text-center pt-2">
            ℹ Дії будуть доступні у новій вкладці
          </div>
        </div>
      </div>

      {/* Status metric boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Box 1: Carts */}
        <div className="bg-surface border border-border/70 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-[22%] bg-[#e6f4ea] dark:bg-[#173B33] flex items-center justify-center mb-3 shrink-0">
            <img src={ReviewIcon} alt="Кошики" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xs text-textMuted font-medium">Кошики</span>
          <span className="text-2xl font-bold text-textMain mt-1">{user.cart_count ?? 0}</span>
        </div>

        {/* Box 2: Reviews */}
        <div className="bg-surface border border-border/70 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-[22%] bg-[#e6f4ea] dark:bg-[#173B33] flex items-center justify-center mb-3 shrink-0">
            <img src={CartIcon} alt="Відгуки" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xs text-textMuted font-medium">Відгуки</span>
          <span className="text-2xl font-bold text-textMain mt-1">{user.reviews_count ?? 0}</span>
        </div>

        {/* Box 3: Last Activity */}
        <div className="bg-surface border border-border/70 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-[22%] bg-[#e6f4ea] dark:bg-[#173B33] flex items-center justify-center mb-3 shrink-0">
            <img src={TimeIcon} alt="Остання активність" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xs text-textMuted font-medium">Остання активність</span>
          <span className="text-[17px] font-bold text-textMain mt-2 leading-none">Сьогодні</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
