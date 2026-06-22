import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/MetricCard';
import { SystemLogsTable } from '@/components/SystemLogsTable';
import { SystemStatusWidget } from '@/components/SystemStatusWidget';
import { QuickActions } from '@/components/QuickActions';
import { DataCollectionWidget } from '@/components/DataCollectionWidget';
import { SourceStatusWidget } from '@/components/SourceStatusWidget';
import { NeedsAttentionWidget } from '@/components/NeedsAttentionWidget';
import { PopularCategoriesWidget } from '@/components/PopularCategoriesWidget';
import { NewUsersWidget } from '@/components/NewUsersWidget';
import { SearchQueriesWidget } from '@/components/SearchQueriesWidget';
import { PopularProductsWidget } from '@/components/PopularProductsWidget';

import { Package, Store, Users, Tag } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

const Dashboard: React.FC = () => {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 bg-accentRed/10 border border-accentRed/20 rounded-xl text-accentRed">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-textMain leading-tight">Головна панель</h1>
        <p className="text-sm text-textMuted mt-1">Огляд ключових показників</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Всього товарів" 
          value={data.metrics.totalProducts.toLocaleString('uk-UA')} 
          icon={Package} 
          iconBgColor="rgba(16, 185, 129, 0.15)"
          iconColor="#10B981"
          trend={{ value: data.metrics.totalProductsTrend, isPositive: true, text: 'від учора' }} 
        />
        <MetricCard 
          title="Магазинів" 
          value={data.metrics.totalStores} 
          icon={Store} 
          iconBgColor="rgba(245, 158, 11, 0.15)"
          iconColor="#F59E0B"
          trend={{ value: data.metrics.totalStoresTrend, isPositive: true, text: 'нових' }} 
        />
        <MetricCard 
          title="Користувачів" 
          value={data.metrics.totalUsers.toLocaleString('uk-UA')} 
          icon={Users} 
          iconBgColor="rgba(139, 92, 246, 0.15)"
          iconColor="#8B5CF6"
          trend={{ value: data.metrics.totalUsersTrend, isPositive: true, text: 'від учора' }} 
        />
        <MetricCard 
          title="Цін оновлено сьогодні" 
          value={data.metrics.pricesUpdatedToday.toLocaleString('uk-UA')} 
          icon={Tag} 
          iconBgColor="rgba(59, 130, 246, 0.15)"
          iconColor="#3B82F6"
          trend={{ value: data.metrics.pricesUpdatedTrend, isPositive: true, text: 'від учора' }} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Chart */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-textMain mb-6">Динаміка оновлення цін</h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priceDynamics} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#6D8279', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#6D8279', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `${val / 1000} тис`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#265447' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#265447" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#265447', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Logs Table */}
          <div className="h-[auto]">
            <SystemLogsTable logs={data.systemLogs} />
          </div>

          {/* Bottom Left Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <NeedsAttentionWidget items={data.needsAttention} />
              <PopularCategoriesWidget categories={data.popularCategories} />
            </div>
            <div className="flex flex-col gap-6">
              <NewUsersWidget users={data.newUsers} />
              <SearchQueriesWidget queries={data.searchQueries} />
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="flex flex-col gap-6">
          <DataCollectionWidget data={data.dataCollection} />
          <SourceStatusWidget sources={data.sourceStatus} />
          <QuickActions />
          <SystemStatusWidget status={data.systemStatus} />
          <PopularProductsWidget products={data.popularProducts} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
