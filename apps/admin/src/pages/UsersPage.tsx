import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Users,
  UserCheck,
  UserPlus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useUsers, useBlockUser, useUnblockUser, type AdminUser } from '@/hooks/useUsers';

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
    'Активний':    { label: 'Активний',    cls: 'bg-[#e6f4ea] text-[#1e8e3e]' },
    'Активна':     { label: 'Активний',    cls: 'bg-[#e6f4ea] text-[#1e8e3e]' },
    'Новий':       { label: 'Новий',       cls: 'bg-[#e8f0fe] text-[#1967d2]' },
    'Неактивний':  { label: 'Заблокований',cls: 'bg-[#fce8e6] text-[#c5221f]' },
    'Заблокований':{ label: 'Заблокований',cls: 'bg-[#fce8e6] text-[#c5221f]' },
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
  <tr className="animate-pulse border-b border-border/50 last:border-0">
    <td className="py-3.5 pl-6 pr-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
        <div className="h-4 w-28 rounded bg-secondary" />
      </div>
    </td>
    <td className="py-3.5 px-3"><div className="h-4 w-36 rounded bg-secondary" /></td>
    <td className="py-3.5 px-3 text-center"><div className="h-5 w-20 rounded bg-secondary mx-auto" /></td>
    <td className="py-3.5 px-3"><div className="h-4 w-6 rounded bg-secondary" /></td>
    <td className="py-3.5 px-3"><div className="h-4 w-6 rounded bg-secondary" /></td>
    <td className="py-3.5 px-3"><div className="h-4 w-28 rounded bg-secondary" /></td>
    <td className="py-3.5 pl-3 pr-6"><div className="h-5 w-10 rounded bg-secondary inline-block" /></td>
  </tr>
);

// ── Actions Dropdown ──────────────────────────────────────────────────────────

const ActionsMenu: React.FC<{ user: AdminUser }> = ({ user }) => {
  const [open, setOpen] = useState(false);
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
          {isBlocked ? (
            <button
              disabled={isUnblocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[#1e8e3e] rounded-md hover:bg-[#177330] transition-colors disabled:opacity-50"
              onClick={handleUnblock}
            >
              <UserCheck size={16} /> Розблокувати
            </button>
          ) : (
            <button
              disabled={isBlocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[#c00000] rounded-md hover:bg-[#a00000] transition-colors font-medium disabled:opacity-50"
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, sub }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-textMuted font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-textMain leading-tight">{value.toLocaleString('uk-UA')}</p>
      <p className="text-xs text-textMuted mt-1">{sub}</p>
    </div>
  </div>
);

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
        <tr>
          <td colSpan={7} className="py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-[#c5221f] opacity-70" />
              <p className="text-sm text-textMuted font-medium">
                Не вдалося завантажити користувачів.<br />
                <span className="text-xs">Перевірте підключення до сервера.</span>
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (paginated.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="py-12 text-center text-sm text-textMuted font-medium">
            Користувачів не знайдено.
          </td>
        </tr>
      );
    }

    return paginated.map((user) => {
      const initials = getInitials(user.name);
      const avatarColor = getAvatarColor(user.name);
      return (
        <tr
          key={user.id}
          className="hover:bg-secondary/40 transition-colors group border-b border-border/50 last:border-0"
        >
          {/* Користувач */}
          <td className="py-3.5 pl-6 pr-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <span className="text-sm font-semibold text-textMain">{user.name}</span>
            </div>
          </td>
          {/* E-mail */}
          <td className="py-3.5 px-3 text-sm text-textMuted whitespace-nowrap">{user.email}</td>
          {/* Статус */}
          <td className="py-3.5 px-3 text-center">
            <StatusBadge status={user.status} />
          </td>
          {/* Кошиків (заглушка) */}
          <td className="py-3.5 px-3 text-sm text-textMuted text-center">
            {user.cart_count ?? '—'}
          </td>
          {/* Відгуки (заглушка) */}
          <td className="py-3.5 px-3 text-sm text-textMuted text-center">
            {user.reviews_count ?? '—'}
          </td>
          {/* Дата реєстрації */}
          <td className="py-3.5 px-3 text-sm text-textMuted whitespace-nowrap">
            {formatDate(user.created_at)}
          </td>
          {/* Дії */}
          <td className="py-3.5 pl-3 pr-6">
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionsMenu user={user} />
            </div>
          </td>
        </tr>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={20} className="text-white" />}
          iconBg="bg-[#26a69a]"
          label="Усього користувачів"
          value={totalUsers}
          sub="Всі зареєстровані користувачі"
        />
        <StatCard
          icon={<UserCheck size={20} className="text-white" />}
          iconBg="bg-[#ef6c00]"
          label="Активні"
          value={activeCount}
          sub={`${totalUsers ? Math.round((activeCount / totalUsers) * 100) : 0}% від усіх користувачів`}
        />
        <StatCard
          icon={<UserPlus size={20} className="text-white" />}
          iconBg="bg-[#1565c0]"
          label="Нові за 7 днів"
          value={newCount}
          sub="За останній тиждень"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
          <input
            type="text"
            placeholder="Пошук за іменем або e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-textMuted"
          />
        </form>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-[38px] px-3 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] min-w-[160px]"
        >
          <option value="">Зі статусу</option>
          <option value="active">Активний</option>
          <option value="new">Новий</option>
          <option value="blocked">Заблокований</option>
        </select>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          className="h-[38px] px-5 bg-surface border border-border rounded-lg text-sm font-medium text-textMain hover:bg-secondary transition-colors whitespace-nowrap"
        >
          Пошук
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 pl-6 pr-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Користувач
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  E-mail
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
                  Статус
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
                  Кошиків
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
                  Відгуки
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Дата реєстрації
                </th>
                <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
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
