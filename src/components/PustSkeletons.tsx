'use client';

import Skeleton from 'react-loading-skeleton';

export function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-stone-200 p-6 space-y-3"
        >
          <Skeleton width="42%" height={12} />
          <Skeleton width="82%" height={22} />
          <Skeleton count={2} height={13} />
          <div className="pt-2 flex justify-between">
            <Skeleton width={90} height={12} />
            <Skeleton width={60} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderAndSectionSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-3">
        <Skeleton width={220} height={12} />
        <Skeleton width="55%" height={36} />
        <Skeleton width="70%" height={16} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white border border-stone-200 p-6 space-y-4">
          <Skeleton height={240} />
          <Skeleton width="65%" height={22} />
          <Skeleton count={3} height={13} />
        </div>
        <div className="lg:col-span-7 space-y-4">
          <CardsGridSkeleton count={4} />
        </div>
      </div>
    </section>
  );
}

export function PortalRecordsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 p-6 space-y-3">
        <Skeleton width={160} height={12} />
        <Skeleton width="45%" height={24} />
        <Skeleton width="80%" height={14} />
      </div>
      <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 space-y-2">
            <div className="flex justify-between gap-4">
              <Skeleton width="48%" height={16} />
              <Skeleton width={90} height={16} />
            </div>
            <Skeleton width="65%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSummarySkeleton() {
  return (
    <div className="space-y-4 bg-white border border-stone-200 p-6">
      <Skeleton width="38%" height={12} />
      <Skeleton width="76%" height={28} />
      <Skeleton count={3} height={14} />
    </div>
  );
}
