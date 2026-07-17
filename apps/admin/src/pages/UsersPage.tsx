import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useBlockUser, useUnblockUser, type AdminUser } from '@/hooks/useUsers';
import { MetricCard } from '@/components/MetricCard';

import UserIcon from '@/assets/MetricCardIcons/User.svg';
import SearchIcon from '@/assets/MetricCardIcons/Search.svg';
import PlaneIcon from '@/assets/MetricCardIcons/Plane.svg';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${h}:${m}`;
  } catch {
    return '—';
  }
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Унікальний колір аватара за першою літерою
const AVATAR_COLORS: Record<string, string> = {
  A: '#4CAF50', B: '#2196F3', C: '#FF9800', D: '#9C27B0',
  E: '#F44336', F: '#00BCD4', G: '#8BC34A', H: '#FF5722',
  I: '#3F51B5', J: '#009688', K: '#CDDC39', L: '#E91E63',
  M: '#FFC107', N: '#673AB7', O: '#03A9F4', P: '#4DB6AC',
  Q: '#FF7043', R: '#26C6DA', S: '#AB47BC', T: '#66BB6A',
  U: '#FFA726', V: '#42A5F5', W: '#EC407A', X: '#26A69A',
  Y: '#D4E157', Z: '#78909C',
};

const getAvatarColor = (name: string) => {
  const letter = name[0]?.toUpperCase() || 'A';
  return AVATAR_COLORS[letter] || '#1abc9c';
};

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    'Активний':    { label: 'Активний',    cls: 'bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#003B2A]' },
    'Активна':     { label: 'Активний',    cls: 'bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#6FE3C2] dark:text-[#003B2A]' },
    'Новий':       { label: 'Новий',       cls: 'bg-[#e8f0fe] text-[#1967d2] dark:bg-[#1A65F2] dark:text-[#051F4E]' },
    'Неактивний':  { label: 'Заблокований',cls: 'bg-[#fce8e6] text-[#c5221f] dark:bg-[#C30404] dark:text-[#400202]' },
    'Заблокований':{ label: 'Заблокований',cls: 'bg-[#fce8e6] text-[#c5221f] dark:bg-[#C30404] dark:text-[#400202]' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ── Row Skeleton ──────────────────────────────────────────────────────────────

const UserRowSkeleton: React.FC = () => (
  <div className="animate-pulse grid grid-cols-[60px_1fr_1.2fr_120px_100px_100px_180px_90px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 rounded-2xl mb-3 h-[74px]">
    <div className="flex items-center justify-center">
      <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
    </div>
    <div className="min-w-0 pr-4 flex flex-col gap-1.5">
      <div className="h-4 w-28 rounded bg-secondary" />
    </div>
    <div className="pr-4">
      <div className="h-4 w-36 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-5 w-20 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-6 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-6 rounded bg-secondary" />
    </div>
    <div className="px-2 flex justify-center">
      <div className="h-4 w-28 rounded bg-secondary" />
    </div>
    <div className="flex items-center justify-center gap-2 pr-4">
      <div className="h-5 w-10 rounded bg-secondary" />
    </div>
  </div>
);

// ── Actions Dropdown ──────────────────────────────────────────────────────────

const ActionsMenu: React.FC<{ user: AdminUser }> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isBlocked = user.status === 'Неактивний' || user.status === 'Заблокований';
  const ref = useRef<HTMLDivElement>(null);

  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const handleBlock = () => {
    blockUser(user.id, {
      onSuccess: () => setOpen(false),
    });
  };

  const handleUnblock = () => {
    unblockUser(user.id, {
      onSuccess: () => setOpen(false),
    });
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary rounded-md transition-colors"
        title="Більше дій"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
          <button
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-textMain hover:bg-secondary rounded-md transition-colors"
            onClick={() => navigate(`/clients/${user.id}`)}
          >
            <User size={16} /> Профіль
          </button>
          <div className="h-[1px] bg-border my-1" />
          {isBlocked ? (
            <button
              disabled={isUnblocking}
              className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-white bg-[#1e8e3e] rounded-md hover:bg-[#177330] transition-colors disabled:opacity-50"
              onClick={handleUnblock}
            >
              <UserCheck size={16} /> Розблокувати
            </button>
          ) : (
            <button
              disabled={isBlocking}
              className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-white bg-[#c00000] rounded-md hover:bg-[#a00000] transition-colors font-medium disabled:opacity-50"
              onClick={handleBlock}
            >
              <Trash2 size={16} /> Заблокувати
            </button>
          )}
        </div>
      )}
    </div>
  );
};



// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onChange: (p: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalItems, limit, onChange }) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <p className="text-sm text-textMuted">
        Показано {start}–{end} з {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-sm text-textMuted">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'text-textMain hover:bg-secondary'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md text-textMuted hover:bg-secondary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const LIMIT = 10;

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data: allUsers = [], isLoading, isError } = useUsers();

  // Локальна фільтрація
  const filtered = allUsers.filter((u) => {
    const q = activeSearch.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === 'active' && (u.status === 'Активний' || u.status === 'Активна')) ||
      (selectedStatus === 'new' && u.status === 'Новий') ||
      (selectedStatus === 'blocked' && (u.status === 'Неактивний' || u.status === 'Заблокований'));
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  // Stats
  const totalUsers = allUsers.length;
  const activeCount = allUsers.filter((u) => u.status === 'Активний' || u.status === 'Активна').length;
  const newCount = allUsers.filter((u) => u.status === 'Новий').length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
  };


  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, i) => <UserRowSkeleton key={i} />);
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 bg-surface border border-border/70 rounded-2xl w-full">
          <AlertCircle size={24} className="text-accentRed opacity-70" />
          <p className="text-sm text-textMuted font-medium text-center">
            Не вдалося завантажити користувачів.<br />
            <span className="text-xs">Перевірте підключення до сервера.</span>
          </p>
        </div>
      );
    }

    if (paginated.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-textMuted font-medium bg-surface border border-border/70 rounded-2xl w-full">
          Користувачів не знайдено.
        </div>
      );
    }

    return paginated.map((user) => {
      const initials = getInitials(user.name);
      const avatarColor = getAvatarColor(user.name);
      return (
        <div 
          key={user.id}
          className="grid grid-cols-[60px_1fr_1.2fr_120px_100px_100px_180px_90px] items-center text-left w-full px-4 py-3 bg-surface border border-border/70 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-border dark:hover:border-[#173B33]/30 transition-all mb-3"
        >
          {/* Column 1: Initials avatar */}
          <div className="flex items-center justify-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          </div>

          {/* Column 2: Name */}
          <div className="min-w-0 pr-4 flex flex-col">
            <span 
              onClick={() => navigate(`/clients/${user.id}`)}
              className="text-sm font-semibold text-textMain hover:text-[#1A65F2] cursor-pointer transition-colors"
            >
              {user.name}
            </span>
          </div>

          {/* Column 3: E-mail */}
          <div className="text-sm text-textMuted truncate pr-4">
            {user.email}
          </div>

          {/* Column 4: Status */}
          <div className="px-2 flex justify-center">
            <StatusBadge status={user.status} />
          </div>

          {/* Column 5: Carts count */}
          <div className="text-sm text-textMuted px-2 text-center">
            {user.cart_count ?? '—'}
          </div>

          {/* Column 6: Reviews count */}
          <div className="text-sm text-textMuted px-2 text-center">
            {user.reviews_count ?? '—'}
          </div>

          {/* Column 7: Registration Date */}
          <div className="text-sm text-textMuted px-2 text-center whitespace-nowrap">
            {formatDate(user.created_at)}
          </div>

          {/* Column 8: Actions */}
          <div className="flex items-center justify-center gap-1">
            <ActionsMenu user={user} />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Користувачі</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Користувачі</p>
      </div>

      {/* ── Top Metrics Grid: Mobile view (visible on small screens) ── */}
      <div className="grid grid-cols-3 gap-2.5 md:hidden">
        <MetricCard
          title="Всього"
          value={totalUsers.toLocaleString('uk-UA')}
          icon={UserIcon}
          iconBgColor="#6FE3C2"
          className="p-3"
        />
        <MetricCard
          title="Активні"
          value={activeCount.toLocaleString('uk-UA')}
          icon={SearchIcon}
          iconBgColor="#008C5E"
          className="p-3"
        />
        <MetricCard
          title="Нові за 7д"
          value={newCount.toLocaleString('uk-UA')}
          icon={PlaneIcon}
          iconBgColor="#1A65F2"
          className="p-3"
        />
      </div>

      {/* ── Top Metrics Grid: Desktop view (visible on md and up) ── */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <MetricCard
          title="Всього користувачів"
          value={totalUsers.toLocaleString('uk-UA')}
          icon={UserIcon}
          iconBgColor="#6FE3C2"
        />
        <MetricCard
          title="Активні"
          value={activeCount.toLocaleString('uk-UA')}
          icon={SearchIcon}
          iconBgColor="#008C5E"
        />
        <MetricCard
          title="Нові за 7 днів"
          value={newCount.toLocaleString('uk-UA')}
          icon={PlaneIcon}
          iconBgColor="#1A65F2"
        />
      </div>

      {/* Toolbar */}
      <div className="w-full">
        {/* Mobile View Toolbar: Grid layout (hidden on md and up) */}
        <div className="grid md:hidden grid-cols-2 gap-x-3.5 gap-y-3 w-full animate-in fade-in p-[1px]">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Пошук</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ім'я, email..." 
                className="w-full pl-3 pr-8 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60 dark:placeholder:text-[#94A3B8]"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-textMuted" />
              </div>
            </div>
          </form>

          {/* Status filter */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Статус</label>
            <div className="relative">
              <select 
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                <option value="">Всі статуси</option>
                <option value="active">Активний</option>
                <option value="new">Новий</option>
                <option value="blocked">Заблокований</option>
              </select>
            </div>
          </div>

          {/* Search Button (Mobile - takes full width) */}
          <button
            type="button"
            onClick={handleSearch}
            className="col-span-2 h-[40px] w-full bg-white dark:bg-transparent border border-[#4ADE80] text-[#173B33] dark:text-[#4ADE80] rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap mt-1"
          >
            Пошук
          </button>
        </div>

        {/* Desktop View Toolbar: Flex layout (hidden on mobile) */}
        <div className="hidden md:flex flex-wrap items-end gap-3.5 w-full animate-in fade-in p-[1px]">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full sm:w-[340px]">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Пошук користувача</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за іменем або e-mail..." 
                className="w-full pl-4 pr-10 py-2 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all placeholder:text-textMuted/60 dark:placeholder:text-[#94A3B8]"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Search size={14} className="text-textMuted" />
              </div>
            </div>
          </form>

          {/* Status filter */}
          <div className="w-full md:w-auto">
            <label className="block text-xs md:text-sm font-bold text-[#173B33] dark:text-[#FFFFFF] mb-1.5 ml-2">Статус</label>
            <div className="relative">
              <select 
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full md:w-[180px] pl-4 pr-8 h-[40px] bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl text-xs md:text-sm text-[#173B33] dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4ADE80] cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.1em_1.1em]"
              >
                <option value="">Всі статуси</option>
                <option value="active">Активний</option>
                <option value="new">Новий</option>
                <option value="blocked">Заблокований</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            className="h-[40px] px-8 bg-white dark:bg-transparent border border-[#4ADE80] text-[#173B33] dark:text-[#4ADE80] rounded-xl text-sm font-semibold hover:bg-secondary/40 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap self-end mb-[1px]"
          >
            Пошук
          </button>
        </div>
      </div>

      {/* Mobile View: list of cards (visible on small screens) */}
      <div className="space-y-3 md:hidden animate-in fade-in">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-surface border border-border/50 rounded-2xl space-y-3 h-[130px]" />
          ))
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl text-sm text-textMuted">
            Користувачів не знайдено
          </div>
        ) : (
          paginated.map((user) => {
            const initials = getInitials(user.name);
            const avatarColor = getAvatarColor(user.name);
            return (
              <div 
                key={user.id}
                className="bg-surface border border-border/60 dark:border-[#173B330F] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 space-y-4 text-left"
              >
                {/* Header: Avatar, Name, Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span 
                        onClick={() => navigate(`/clients/${user.id}`)}
                        className="text-sm font-semibold text-textMain hover:text-[#1A65F2] cursor-pointer truncate"
                      >
                        {user.name}
                      </span>
                      <span className="text-xs text-textMuted truncate">{user.email}</span>
                    </div>
                  </div>
                  <ActionsMenu user={user} />
                </div>

                <div className="h-px bg-border/40" />

                {/* Info Row: Status, Carts, Reviews */}
                <div className="flex items-center justify-between gap-2 text-xs text-textMuted flex-wrap">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Кошики: <strong className="text-textMain">{user.cart_count ?? 0}</strong></span>
                    <span>Відгуки: <strong className="text-textMain">{user.reviews_count ?? 0}</strong></span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-textMuted">
                  <span>Зареєстрований:</span>
                  <span className="font-medium">{formatDate(user.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block w-full overflow-x-auto pb-2">
        <div className="min-w-[900px] w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[60px_1fr_1.2fr_120px_100px_100px_180px_90px] items-center text-left w-full px-4 py-3 bg-white dark:bg-[#1C2723] border border-border dark:border-[#4ADE80]/20 rounded-xl mb-4 text-xs font-bold text-[#173B33] dark:text-[#FFFFFF] uppercase tracking-wider shadow-sm animate-in fade-in">
            <div /> {/* Spacer for avatar */}
            <div>Користувач</div>
            <div className="pr-4">E-mail</div>
            <div className="px-2 text-center">Статус</div>
            <div className="px-2 text-center">Кошиків</div>
            <div className="px-2 text-center">Відгуки</div>
            <div className="px-2 text-center">Дата реєстрації</div>
            <div className="text-center pr-4">Дії</div>
          </div>

          {/* Rows container */}
          <div className="space-y-3 animate-in fade-in">
            {renderBody()}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          limit={LIMIT}
          onChange={setPage}
        />
      )}
    </div>
  );
};

export default UsersPage;
