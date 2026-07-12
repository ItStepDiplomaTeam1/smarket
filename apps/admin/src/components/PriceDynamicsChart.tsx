import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PriceDynamicsChartProps {
  data: Array<{ name: string; value: number }>;
}

const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.0', '')} млн`;
  }
  if (value >= 1000) {
    return `${value / 1000} тис`;
  }
  return value.toString();
};

export const PriceDynamicsChart: React.FC<PriceDynamicsChartProps> = ({ data }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-textMain">Динаміка оновлення цін</h3>
          <p className="text-xs text-textMuted mt-0.5">Кількість цінових пропозицій оновлених за останні 7 днів</p>
        </div>
      </div>

      <div className="h-[180px] sm:h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" strokeWidth={2} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontFamily: 'inherit',
                fontSize: '12px'
              }}
              formatter={(value: any) => [Number(value).toLocaleString('uk-UA'), 'Оновлено цін']}
              labelStyle={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
