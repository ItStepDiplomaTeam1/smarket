import React from 'react';
import { useSystemStatus, type ServiceStatus } from '@/hooks/useSystemStatus';

// ── Display config ────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  'API Gateway':      'API Gateway',
  'Auth Service':     'Служба авторизації (FastAPI)',
  'Product Service':  'Служба товарів (FastAPI)',
  'Cart Service':     'Служба кошика (FastAPI)',
  'Reviews Service':  'Служба відгуків (FastAPI)',
  'Search Service':   'Пошуковий сервіс (Rust)',
  'ETL Service':      'Служба імпорту (Go ETL)',
  'Email Worker':     'Служба розсилок (FastStream)',
  'Audit Service':    'Служба аудиту (FastAPI)',
};

// Ordered list of microservices only
const SERVICE_ORDER = [
  'API Gateway',
  'Auth Service',
  'Product Service',
  'Cart Service',
  'Reviews Service',
  'Search Service',
  'ETL Service',
  'Email Worker',
  'Audit Service',
];

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const isOk = status === 'Працює';
  return (
    <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
      {isOk && (
        <>
          {/* Pulsing ring for healthy services */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </>
      )}
      {!isOk && (
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      )}
    </div>
  );
};

const StatusText: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const isOk = status === 'Працює';
  return (
    <span className={`text-xs font-medium ${isOk ? 'text-green-500' : 'text-red-500'}`}>
      {status}
    </span>
  );
};

// Skeleton row shown while data is loading
const SkeletonRow: React.FC = () => (
  <div className="flex justify-between items-center py-1">
    <div className="h-3 w-32 bg-border rounded animate-pulse" />
    <div className="h-3 w-14 bg-border rounded animate-pulse" />
  </div>
);

// ── Main Widget ───────────────────────────────────────────────────────────────

export const SystemStatusWidget: React.FC = () => {
  const { data, isLoading, isError, dataUpdatedAt } = useSystemStatus();

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-textMain">Статус системи</h3>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] text-textMuted font-medium">LIVE</span>
        </div>
      </div>

      {/* Service rows */}
      <div className="space-y-3.5">
        {isLoading && SERVICE_ORDER.map((name) => (
          <SkeletonRow key={name} />
        ))}

        {isError && !isLoading && (
          <p className="text-xs text-red-500 text-center py-2">
            Не вдалося отримати статус системи
          </p>
        )}

        {data && SERVICE_ORDER.map((serviceKey) => {
          const status = data[serviceKey];
          if (status === undefined) return null;
          return (
            <div key={serviceKey} className="flex justify-between items-center text-sm">
              <span className="font-medium text-textMain">
                {SERVICE_LABELS[serviceKey] ?? serviceKey}
              </span>
              <div className="flex items-center gap-2">
                <StatusDot status={status} />
                <StatusText status={status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Last updated timestamp */}
      {lastUpdated && (
        <p className="text-[10px] text-textMuted mt-4 text-right">
          Оновлено о {lastUpdated}
        </p>
      )}
    </div>
  );
};
