import React from 'react';

interface LoadingSkeletonProps {
  id?: string;
  className?: string;
  variant?: 'rectangular' | 'rounded' | 'circular' | 'pill' | 'text';
  width?: string | number;
  height?: string | number;
  shimmer?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  id,
  className = '',
  variant = 'rounded',
  width,
  height,
  shimmer = true,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'pill':
        return 'rounded-full';
      case 'text':
        return 'rounded-md h-4';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      id={id}
      style={style}
      aria-hidden="true"
      className={`relative overflow-hidden bg-white/[0.06] border border-white/[0.04] backdrop-blur-sm ${getVariantClass()} ${
        shimmer
          ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent"
          : 'animate-pulse'
      } ${className}`}
    />
  );
};

// ============================================================================
// Specialized Dashboard & Log Skeleton Compositions
// ============================================================================

export const SkeletonMetricCard: React.FC<{ id?: string; className?: string }> = ({
  id,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`p-5 rounded-2xl bg-neutral-900/70 border border-white/10 backdrop-blur-md space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="text" className="w-24 h-3.5" />
        <LoadingSkeleton variant="circular" className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton variant="rounded" className="w-32 h-7" />
        <LoadingSkeleton variant="text" className="w-20 h-3" />
      </div>
      <LoadingSkeleton variant="pill" className="w-full h-2" />
    </div>
  );
};

export const SkeletonDashboard: React.FC<{ id?: string }> = ({ id = 'skeleton-dashboard' }) => {
  return (
    <div id={id} className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <LoadingSkeleton variant="rounded" className="w-48 sm:w-64 h-8" />
          <LoadingSkeleton variant="text" className="w-36 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="rounded" className="w-28 h-9" />
          <LoadingSkeleton variant="rounded" className="w-32 h-9" />
        </div>
      </div>

      {/* Hero Calorie Banner Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <LoadingSkeleton variant="pill" className="w-28 h-6" />
            <LoadingSkeleton variant="rounded" className="w-44 h-10" />
            <LoadingSkeleton variant="text" className="w-60 h-4" />
          </div>
          <div className="flex items-center justify-center">
            <LoadingSkeleton variant="circular" className="w-32 h-32 sm:w-36 sm:h-36" />
          </div>
        </div>

        {/* Macro Bars Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <LoadingSkeleton variant="text" className="w-16 h-3" />
                <LoadingSkeleton variant="text" className="w-12 h-3" />
              </div>
              <LoadingSkeleton variant="pill" className="w-full h-2.5" />
            </div>
          ))}
        </div>
      </div>

      {/* 4-Metric Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonMetricCard key={i} id={`skeleton-metric-${i}`} />
        ))}
      </div>

      {/* Recent Activity & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <LoadingSkeleton variant="rounded" className="w-36 h-5" />
            <LoadingSkeleton variant="pill" className="w-16 h-5" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <LoadingSkeleton variant="rounded" className="w-10 h-10" />
                  <div className="space-y-1.5">
                    <LoadingSkeleton variant="text" className="w-28 h-3.5" />
                    <LoadingSkeleton variant="text" className="w-20 h-2.5" />
                  </div>
                </div>
                <LoadingSkeleton variant="rounded" className="w-14 h-6" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <LoadingSkeleton variant="rounded" className="w-32 h-5" />
            <LoadingSkeleton variant="pill" className="w-16 h-5" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <LoadingSkeleton variant="circular" className="w-9 h-9" />
                  <div className="space-y-1.5">
                    <LoadingSkeleton variant="text" className="w-32 h-3.5" />
                    <LoadingSkeleton variant="text" className="w-24 h-2.5" />
                  </div>
                </div>
                <LoadingSkeleton variant="rounded" className="w-16 h-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonMealLog: React.FC<{ id?: string }> = ({ id = 'skeleton-meal-log' }) => {
  return (
    <div id={id} className="space-y-5 animate-in fade-in duration-300">
      {/* Tab Switcher Skeleton */}
      <div className="grid grid-cols-4 p-1 rounded-2xl bg-neutral-900/90 border border-white/10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-2.5 px-2 flex justify-center">
            <LoadingSkeleton variant="rounded" className="w-20 h-6" />
          </div>
        ))}
      </div>

      {/* Main Form Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-6">
        <div className="flex justify-between items-center">
          <LoadingSkeleton variant="rounded" className="w-48 h-6" />
          <LoadingSkeleton variant="pill" className="w-24 h-6" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} variant="rounded" className="h-9" />
          ))}
        </div>
        <div className="space-y-2">
          <LoadingSkeleton variant="text" className="w-32 h-3.5" />
          <LoadingSkeleton variant="rounded" className="w-full h-24" />
        </div>
        <div className="flex gap-3">
          <LoadingSkeleton variant="rounded" className="w-32 h-10" />
          <LoadingSkeleton variant="rounded" className="flex-1 h-10" />
        </div>
      </div>
    </div>
  );
};
