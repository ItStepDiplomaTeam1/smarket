import React from 'react';

// Generic shimmering card to use in grids
export const ProductCardSkeleton = () => (
  <div className="w-[271px] h-[489px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[16px] flex flex-col box-border dark:bg-[#1D2A25] dark:border-[rgba(38,84,71,0.2)] transition-colors">
    {/* Product Image placeholder */}
    <div className="w-full h-[339px] rounded-[10px] shimmer-bg mb-[16px]" />
    {/* Title placeholder */}
    <div className="h-4 shimmer-bg rounded w-3/4 mb-[8px]" />
    <div className="h-3 shimmer-bg rounded w-1/2 mb-[16px]" />
    {/* Price & Button placeholder */}
    <div className="mt-auto flex justify-between items-center">
      <div className="h-5 shimmer-bg rounded w-1/3" />
      <div className="h-[26px] w-[92px] shimmer-bg rounded-[10px]" />
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
