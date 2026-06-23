import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';

// ── Skeleton row shown while loading ─────────────────────────────────────────

const UserRowSkeleton: React.FC = () => (
  <li className="flex items-center gap-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="h-3 w-24 rounded bg-secondary" />
      <div className="h-2.5 w-32 rounded bg-secondary" />
    </div>
    <div className="h-5 w-14 rounded-full bg-secondary shrink-0" />
  </li>
);

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'Активний';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
};

// ── Main widget ───────────────────────────────────────────────────────────────

export const NewUsersWidget: React.FC = () => {
  const { data: users, isLoading, isError } = useAdminUsers(5);

  const renderBody = () => {
    // ── Loading state ──
    if (isLoading) {
      return (
        <ul className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <UserRowSkeleton key={i} />
          ))}
        </ul>
      );
    }

    // ── Error state ──
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <AlertCircle size={24} className="text-accentRed opacity-70" />
          <p className="text-sm text-textMuted">
            Не вдалося завантажити дані.
            <br />
            <span className="text-xs">Перевірте підключення або спробуйте пізніше.</span>
          </p>
        </div>
      );
    }

    // ── Empty state ──
    if (!users || users.length === 0) {
      return (
        <p className="text-sm text-textMuted text-center py-6">
          Нових користувачів поки немає.
        </p>
      );
    }

    // ── Success state ──
    return (
      <ul className="space-y-4">
        {users.map((user) => {
          const initials = user.name.slice(0, 2).toUpperCase();
          const formattedDate = new Date(user.created_at).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <li key={user.id} className="flex items-center gap-3">
              {/* Avatar with initials */}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 shrink-0">
                {initials}
              </div>

              {/* Name + Email */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-textMain leading-tight capitalize truncate">
                  {user.name}
                </span>
                <span className="text-xs text-textMuted leading-tight truncate">
                  {user.email}
                </span>
              </div>

              {/* Right side: status badge + date */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <StatusBadge status={user.status} />
                <span className="text-[10px] text-textMuted">{formattedDate}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg text-textMain">Нові користувачі</h3>
        {isLoading && (
          <span className="text-xs text-textMuted animate-pulse">Завантаження…</span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-2">{renderBody()}</div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border mt-auto">
        <a
          href="#"
          className="text-sm font-medium text-textMuted hover:text-primary transition-colors flex items-center"
        >
          Переглянути всіх користувачів
          <ChevronRight size={16} className="ml-1" />
        </a>
      </div>
    </div>
  );
};
