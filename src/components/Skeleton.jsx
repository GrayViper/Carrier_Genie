import React from 'react';

/**
 * Generic skeleton block.
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton variant="round" className="h-10 w-10" />
 *   <Skeleton variant="card" className="h-32 w-full" />
 */
export default function Skeleton({ className = '', variant = '' }) {
  const variantClass =
    variant === 'round' ? 'skeleton-round' :
    variant === 'card'  ? 'skeleton-card'  : '';
  return <div className={`skeleton ${variantClass} ${className}`} />;
}

/** Row of n skeleton lines, useful for text blocks */
export function SkeletonLines({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Standard job-card skeleton */
export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="round" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonLines lines={2} />
      <div className="flex gap-2">
        <Skeleton variant="round" className="h-6 w-16" />
        <Skeleton variant="round" className="h-6 w-16" />
        <Skeleton variant="round" className="h-6 w-20" />
      </div>
    </div>
  );
}

/** Stat card skeleton (dashboard) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Application list item skeleton */
export function AppItemSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex justify-between items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton variant="round" className="h-10 w-10 shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton variant="round" className="h-6 w-16" />
    </div>
  );
}
