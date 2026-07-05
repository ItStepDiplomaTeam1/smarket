import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/MetricCard';
import { SystemLogsTable } from '@/components/SystemLogsTable';
import { SystemStatusWidget } from '@/components/SystemStatusWidget';
import { QuickActions } from '@/components/QuickActions';

import { NeedsAttentionWidget } from '@/components/NeedsAttentionWidget';
import { PopularCategoriesWidget } from '@/components/PopularCategoriesWidget';
import { NewUsersWidget } from '@/components/NewUsersWidget';
import { SearchQueriesWidget } from '@/components/SearchQueriesWidget';
import { PopularProductsWidget } from '@/components/PopularProductsWidget';

import { Package, Store, Users, Tag } from 'lucide-react';


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
            />
            <MetricCard
              title="Магазинів"
              value={data.metrics.totalStores}
              icon={Store}
              iconBgColor="#F59E0B"
            />
            <MetricCard
              title="Користувачів"
              value={data.metrics.totalUsers.toLocaleString('uk-UA')}
              icon={Users}
              iconBgColor="#8B5CF6"
            />
            <MetricCard
              title="Цін оновлено сьогодні"
              value={data.metrics.pricesUpdatedToday.toLocaleString('uk-UA')}
              icon={Tag}
              iconBgColor="#3B82F6"
            />
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

        {/* Right Column ("Sidebar" of widgets) */}
        <div className="flex flex-col gap-6">
          <QuickActions />
          <SystemStatusWidget />
          <PopularProductsWidget products={data.popularProducts} />
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
