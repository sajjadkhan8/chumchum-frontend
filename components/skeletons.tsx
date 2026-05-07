'use client';

import { cn } from '@/lib/utils';

interface CreatorCardSkeletonProps {
  className?: string;
}

export function CreatorCardSkeleton({ className }: CreatorCardSkeletonProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {/* Image skeleton */}
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      
      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              ))}
            </div>
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        
        {/* Categories */}
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        
        {/* Engagement */}
        <div className="flex justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PackageCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      
      <div className="space-y-4 p-4">
        <div>
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      
      <div className="flex items-center justify-between border-t border-border bg-muted/50 p-4">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function ReviewCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 h-3 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}
