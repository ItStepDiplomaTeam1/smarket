import React from 'react';

type ProductSkeletonViewMode = 'grid' | 'list';

interface ProductCardSkeletonProps {
  viewMode?: ProductSkeletonViewMode;
}

const GRID_SKELETON_IDS = Array.from({ length: 8 }, (_, index) => `grid-${index}`);
const LIST_SKELETON_IDS = Array.from({ length: 4 }, (_, index) => `list-${index}`);

// Generic shimmering card that mirrors both catalog layouts.
export const ProductCardSkeleton = ({ viewMode = 'grid' }: ProductCardSkeletonProps) => {
  const isListView = viewMode === 'list';

  return (
    <div
      aria-hidden="true"
      className={`border border-[#E5E7EB] dark:border-transparent rounded-[12px] p-[16px] bg-white dark:bg-[#15231D] box-border ${
        isListView
          ? 'flex min-h-[260px] flex-col sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:grid-rows-[auto_1fr] sm:gap-x-[20px]'
          : 'flex min-h-[404px] flex-col'
      }`}
    >
      <div className={`flex min-h-[24px] items-center justify-between ${isListView ? 'sm:col-start-2 sm:row-start-1' : ''}`}>
        <div className="h-[18px] w-[58px] rounded-[4px] shimmer-bg" />
        <div className="h-[18px] w-[18px] rounded-full shimmer-bg" />
      </div>

      <div
        className={`w-full rounded-[8px] shimmer-bg ${
          isListView
            ? 'mt-[12px] mb-[16px] h-[140px] sm:col-start-1 sm:row-start-1 sm:row-span-2 sm:mt-0 sm:mb-0 sm:h-full sm:min-h-[190px]'
            : 'mt-[12px] mb-[16px] h-[140px]'
        }`}
      />

      <div className={`flex flex-1 flex-col ${isListView ? 'sm:col-start-2 sm:row-start-2' : ''}`}>
        <div className="mb-[8px] h-[10px] w-1/3 rounded shimmer-bg" />
        <div className="mb-[7px] h-[16px] w-5/6 rounded shimmer-bg" />
        <div className="mb-[16px] h-[16px] w-2/3 rounded shimmer-bg" />
        <div className="mb-[18px] h-[12px] w-1/2 rounded shimmer-bg" />

        <div className={`mt-auto flex gap-[16px] ${isListView ? 'flex-col sm:flex-row sm:items-end sm:justify-between' : 'flex-col'}`}>
          <div className="space-y-[5px]">
            <div className="h-[10px] w-[24px] rounded shimmer-bg" />
            <div className="h-[22px] w-[82px] rounded shimmer-bg" />
          </div>
          <div className={`${isListView ? 'w-full sm:w-[160px]' : 'w-full'} h-[34px] rounded-[6px] shimmer-bg`} />
        </div>
      </div>
    </div>
  );
};

export const CatalogProductsSkeleton = ({ viewMode = 'grid' }: ProductCardSkeletonProps) => {
  const skeletonIds = viewMode === 'list' ? LIST_SKELETON_IDS : GRID_SKELETON_IDS;

  return (
    <>
      <div
        className="relative col-span-full overflow-hidden rounded-[14px] border border-[#DCECE5] bg-[#F2FBF7] px-[18px] py-[14px] dark:border-[#244337] dark:bg-[#13271E]"
        role="status"
        aria-live="polite"
      >
        <div className="relative flex items-center gap-[12px]">
          <span className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#1A3026]">
            <span className="absolute inset-[5px] rounded-full border-2 border-[#BEE7D4] border-t-[#265447] motion-safe:animate-spin dark:border-[#285440] dark:border-t-[#3CD27D]" />
            <span className="h-[6px] w-[6px] rounded-full bg-[#265447] dark:bg-[#3CD27D]" />
          </span>

          <div className="min-w-0">
            <p className="m-0 font-manrope text-[14px] font-extrabold text-[#183E32] dark:text-white">
              Завантажуємо товари
            </p>
            <p className="m-0 mt-[2px] truncate text-[12px] text-[#6D8279] dark:text-[#A4B3AF]">
              Збираємо актуальні ціни з магазинів…
            </p>
          </div>

          <span className="ml-auto hidden items-end gap-[4px] sm:flex" aria-hidden="true">
            <span className="h-[5px] w-[5px] rounded-full bg-[#3CD27D] motion-safe:animate-bounce" />
            <span className="h-[5px] w-[5px] rounded-full bg-[#3CD27D] motion-safe:animate-bounce [animation-delay:120ms]" />
            <span className="h-[5px] w-[5px] rounded-full bg-[#3CD27D] motion-safe:animate-bounce [animation-delay:240ms]" />
          </span>
        </div>
      </div>

      {skeletonIds.map((id) => (
        <ProductCardSkeleton key={id} viewMode={viewMode} />
      ))}
    </>
  );
};

export const CatalogRefreshIndicator = () => (
  <div className="pointer-events-none absolute inset-x-0 -top-[8px] z-10" role="status" aria-live="polite">
    <span className="sr-only">Оновлюємо список товарів…</span>
    <div className="h-[3px] overflow-hidden rounded-full bg-[#DDEDE6] dark:bg-[#20382E]">
      <div className="catalog-progress-bar h-full w-[42%] rounded-full bg-gradient-to-r from-transparent via-[#2DBE72] to-transparent dark:via-[#3CD27D]" />
    </div>
  </div>
);

// Skeleton for the Catalog Page
export const CatalogSkeleton = () => (
  <div className="max-w-[1230px] mx-auto px-6 py-8 flex gap-8">
    {/* Left sidebar filters skeleton */}
    <div className="hidden lg:block w-[280px] shrink-0">
      <div className="h-6 shimmer-bg rounded w-1/2 mb-6" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="mb-6">
          <div className="h-4 shimmer-bg rounded w-2/3 mb-3" />
          <div className="h-3 shimmer-bg rounded w-full mb-2" />
          <div className="h-3 shimmer-bg rounded w-5/6 mb-2" />
          <div className="h-3 shimmer-bg rounded w-4/5" />
        </div>
      ))}
    </div>
    
    {/* Right products grid skeleton */}
    <div className="flex-1">
      <div className="h-8 shimmer-bg rounded w-1/4 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Skeleton for the Shops list Page
export const ShopsSkeleton = () => (
  <div className="max-w-[1230px] mx-auto px-6 py-8">
    <div className="h-8 shimmer-bg rounded w-1/4 mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-6 h-[180px] flex flex-col justify-between dark:bg-[#1D2A25] dark:border-[rgba(38,84,71,0.2)]">
          <div>
            <div className="h-5 shimmer-bg rounded w-1/3 mb-2" />
            <div className="h-3 shimmer-bg rounded w-2/3" />
          </div>
          <div className="h-[36px] shimmer-bg rounded-[10px] w-full" />
        </div>
      ))}
    </div>
  </div>
);

// General purpose skeleton for standard text pages (Privacy, Terms, Forgot Password etc.)
export const PageSkeleton = () => (
  <div className="max-w-[800px] mx-auto px-6 py-12">
    <div className="h-8 shimmer-bg rounded w-1/3 mb-6" />
    <div className="space-y-4">
      <div className="h-4 shimmer-bg rounded w-full" />
      <div className="h-4 shimmer-bg rounded w-5/6" />
      <div className="h-4 shimmer-bg rounded w-11/12" />
      <div className="h-4 shimmer-bg rounded w-3/4 mt-8" />
      <div className="h-4 shimmer-bg rounded w-full" />
      <div className="h-4 shimmer-bg rounded w-5/6" />
    </div>
  </div>
);

// Skeleton for Product Detail view
export const ProductDetailSkeleton = () => (
  <div className="max-w-[1230px] mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
    {/* Left image column */}
    <div className="w-full md:w-[450px] shrink-0">
      <div className="w-full h-[400px] shimmer-bg rounded-[16px] mb-4" />
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-[80px] h-[80px] shimmer-bg rounded-[8px]" />
        ))}
      </div>
    </div>
    
    {/* Right detail column */}
    <div className="flex-1 py-4">
      <div className="h-8 shimmer-bg rounded w-3/4 mb-4" />
      <div className="h-4 shimmer-bg rounded w-1/4 mb-8" />
      <div className="h-6 shimmer-bg rounded w-1/3 mb-4" />
      <div className="h-10 shimmer-bg rounded-[10px] w-1/2 mb-8" />
      <div className="space-y-3">
        <div className="h-3 shimmer-bg rounded w-full" />
        <div className="h-3 shimmer-bg rounded w-5/6" />
        <div className="h-3 shimmer-bg rounded w-4/5" />
      </div>
    </div>
  </div>
);
