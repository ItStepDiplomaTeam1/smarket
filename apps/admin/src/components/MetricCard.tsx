import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, value, icon: Icon, iconBgColor, iconColor, trend, className 
}) => {
  return (
    <div className={cn("bg-surface border border-border rounded-2xl p-5 flex flex-col shadow-sm", className)}>
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        <Icon size={24} strokeWidth={2} />
      </div>
      
      <h3 className="text-textMuted text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold text-textMain mb-2">{value}</div>
      
      {trend && (
        <div className="flex items-center text-xs mt-auto">
          <span className={cn(
            "flex items-center font-semibold mr-1.5",
            trend.isPositive ? "text-accentGreen" : "text-accentRed"
          )}>
            {trend.isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            {trend.value}%
          </span>
          <span className="text-textMuted">{trend.text}</span>
        </div>
      )}
    </div>
  );
};

