import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
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
  icon,
  iconBgColor,
  trend,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl p-4 sm:p-5 flex flex-col items-start border border-border shadow-sm w-full',
        className
      )}
    >
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[22%] flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        <img src={icon} alt={title} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
      </div>

      {/* Content */}
      <div className="flex flex-col mt-4 w-full">
        <p className="text-xs sm:text-sm text-textMuted leading-tight font-medium">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-textMain leading-none tracking-tight mt-1.5">
          {value}
        </p>
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs sm:text-sm font-medium mt-3',
            trend.isPositive ? 'text-accentGreen' : 'text-accentRed'
          )}
        >
          {trend.isPositive ? (
            <ArrowUpRight size={14} className="shrink-0" />
          ) : (
            <ArrowDownRight size={14} className="shrink-0" />
          )}
          <span>
            {trend.value}% {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
