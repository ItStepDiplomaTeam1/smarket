import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  trend,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl p-5 flex flex-col justify-between border border-border shadow-sm aspect-square max-h-[220px]',
        className
      )}
    >
      {/* Icon square */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={22} strokeWidth={2} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-textMuted leading-tight">{title}</p>
        <p className="text-[28px] font-bold text-textMain leading-none tracking-tight">
          {value}
        </p>
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend.isPositive ? 'text-accentGreen' : 'text-accentRed'
          )}
        >
          {trend.isPositive ? (
            <ArrowUpRight size={16} strokeWidth={2} />
          ) : (
            <ArrowDownRight size={16} strokeWidth={2} />
          )}
          <span>
            {trend.value}% {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
