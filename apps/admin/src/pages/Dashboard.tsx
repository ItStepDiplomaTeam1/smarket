import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/MetricCard';
import { SystemLogsTable } from '@/components/SystemLogsTable';
import { QuickActions } from '@/components/QuickActions';
import { SystemStatusWidget } from '@/components/SystemStatusWidget';

import { NeedsAttentionWidget } from '@/components/NeedsAttentionWidget';
import { PopularCategoriesWidget } from '@/components/PopularCategoriesWidget';
import { NewUsersWidget } from '@/components/NewUsersWidget';
import { PopularProductsWidget } from '@/components/PopularProductsWidget';

import PackageIcon from '@/assets/MetricCardIcons/Package.svg';
import StoreIcon from '@/assets/MetricCardIcons/Stores.svg';
import UsersIcon from '@/assets/MetricCardIcons/Users.svg';
import TagIcon from '@/assets/MetricCardIcons/Tag.svg';


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
              icon={PackageIcon}
              iconBgColor="#6FE3C2"
            />
            <MetricCard
              title="Магазинів"
              value={data.metrics.totalStores}
              icon={StoreIcon}
              iconBgColor="#FDC80D"
            />
            <MetricCard
              title="Користувачів"
              value={data.metrics.totalUsers.toLocaleString('uk-UA')}
              icon={UsersIcon}
              iconBgColor="#9704C3"
            />
            <MetricCard
              title="Цін оновлено"
              value={data.metrics.pricesUpdatedToday.toLocaleString('uk-UA')}
              icon={TagIcon}
              iconBgColor="#1A65F2"
            />
          </div>



          {/* System logs */}
          <SystemLogsTable />

          {/* 4-col bottom widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <NeedsAttentionWidget items={data.needsAttention} />
            <NewUsersWidget />
            <PopularCategoriesWidget categories={data.popularCategories} />
          </div>
        </div>

        {/* Right Column ("Sidebar" of widgets) */}
        <div className="flex flex-col gap-6">
          <SystemStatusWidget />
          <QuickActions />
          <PopularProductsWidget products={data.popularProducts} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
