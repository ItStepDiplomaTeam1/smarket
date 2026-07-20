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
  subtext?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  trend,
  subtext,
  className,
}) => {
  // Determine if it has row orientation in its className (e.g. flex-row)
  const isRowLayout = className?.includes('flex-row');

  return (
    <div
      className={cn(
        'bg-surface rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start border border-border shadow-sm w-full h-full',
        className
      )}
    >
      <div className={cn("flex w-full h-full flex-1", isRowLayout ? "flex-row items-center gap-4 lg:flex-col lg:items-start lg:gap-0" : "flex-col items-start")}>
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-[22%] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <img src={icon} alt={title} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
        </div>

        {/* Content */}
        <div className={cn("flex flex-col w-full flex-1 justify-between", isRowLayout ? "mt-0 lg:mt-4" : "mt-4")}>
          <p className="text-xs sm:text-sm text-textMuted leading-tight font-medium">
            {title}
          </p>
          <div className="mt-auto pt-1.5 flex flex-col">
            <p className="text-xl sm:text-2xl font-bold text-textMain leading-none tracking-tight">
              {value}
            </p>

            {/* Trend */}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs sm:text-sm font-medium mt-2',
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

            {/* Subtext */}
            {subtext && (
              <div className="text-xs text-textMuted mt-2 font-medium">
                {subtext}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
