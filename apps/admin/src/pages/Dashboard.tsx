import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/MetricCard';
import { SystemLogsTable } from '@/components/SystemLogsTable';
import { SystemStatusWidget } from '@/components/SystemStatusWidget';
import { QuickActions } from '@/components/QuickActions';
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
    <div className="space-y-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Головна панель</h1>
        <p className="text-sm text-textMuted mt-0.5">Огляд ключових показників</p>
      </div>

      {/* ─── Main Content Area (Left: 2 cols, Right: 1 col "Sidebar") ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* ─── Top section: 4 KPI Cards in a single row ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Всього товарів"
              value={data.metrics.totalProducts.toLocaleString('uk-UA')}
              icon={Package}
              iconBgColor="#10B981"
              trend={{ value: data.metrics.totalProductsTrend, isPositive: true, text: 'від учора' }}
            />
            <MetricCard
              title="Магазинів"
              value={data.metrics.totalStores}
              icon={Store}
              iconBgColor="#F59E0B"
              trend={{ value: data.metrics.totalStoresTrend, isPositive: true, text: 'нових' }}
            />
            <MetricCard
              title="Користувачів"
              value={data.metrics.totalUsers.toLocaleString('uk-UA')}
              icon={Users}
              iconBgColor="#8B5CF6"
              trend={{ value: data.metrics.totalUsersTrend, isPositive: true, text: 'від учора' }}
            />
            <MetricCard
              title="Цін оновлено"
              value={data.metrics.pricesUpdatedToday.toLocaleString('uk-UA')}
              icon={Tag}
              iconBgColor="#3B82F6"
              trend={{ value: data.metrics.pricesUpdatedTrend, isPositive: true, text: 'від учора' }}
            />
          </div>

          {/* Price dynamics chart */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-textMain mb-5">Динаміка оновлення цін</h3>
            <div className="w-full h-[320px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      color: '#111827',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    itemStyle={{ color: '#265447' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#265447"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#265447', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System logs */}
          <SystemLogsTable logs={data.systemLogs} />

          {/* 4-col bottom widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <NeedsAttentionWidget items={data.needsAttention} />
            <NewUsersWidget />
            <PopularCategoriesWidget categories={data.popularCategories} />
            <SearchQueriesWidget queries={data.searchQueries} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <SourceStatusWidget sources={data.sourceStatus} />
          <QuickActions />
          <SystemStatusWidget />
          <PopularProductsWidget products={data.popularProducts} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
