import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/[0.07] rounded-xl relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent ${className}`}
    />
  );
}

export function PosterCardSkeleton() {
  return (
    <div className="space-y-2.5 flex-none w-36 sm:w-44 md:w-52">
      <div className="relative aspect-poster rounded-2xl overflow-hidden bg-white/[0.05] border border-white/5 animate-pulse">
        <Skeleton className="w-full h-full rounded-2xl" />
        <div className="absolute top-2.5 right-2.5 w-12 h-5 rounded-xl bg-white/10" />
      </div>
      <div className="space-y-1.5 px-0.5">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative min-h-[48vh] sm:min-h-[58vh] rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] p-6 sm:p-12 flex flex-col justify-end space-y-4 animate-pulse">
      <div className="space-y-3 max-w-xl">
        <Skeleton className="w-32 h-6 rounded-xl bg-sky-500/20" />
        <Skeleton className="w-4/5 h-10 sm:h-12 rounded-2xl" />
        <Skeleton className="w-full h-4 rounded-lg" />
        <Skeleton className="w-2/3 h-4 rounded-lg" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="w-20 h-6 rounded-lg bg-amber-500/20" />
          <Skeleton className="w-16 h-6 rounded-lg" />
          <Skeleton className="w-24 h-6 rounded-lg" />
        </div>
        <div className="flex gap-3 pt-3">
          <Skeleton className="w-32 h-11 rounded-xl bg-sky-500/30" />
          <Skeleton className="w-28 h-11 rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function RowSectionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="space-y-3 py-2">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-6 w-44 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-xl" />
      </div>
      <div className="flex gap-4 overflow-hidden py-1">
        {Array.from({ length: count }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function ShotsFeedSkeleton() {
  return (
    <div className="w-full h-[calc(100dvh-5rem)] md:max-w-md md:h-[86vh] md:my-2 mx-auto relative rounded-none md:rounded-3xl border-0 md:border md:border-white/10 bg-zinc-950 overflow-hidden flex items-center justify-center animate-pulse select-none">
      {/* Top Bar Skeleton */}
      <div className="absolute top-4 left-4 z-20">
        <Skeleton className="w-9 h-9 rounded-full bg-white/10" />
      </div>
      <div className="absolute top-4 right-4 z-20">
        <Skeleton className="w-28 h-7 rounded-full bg-white/10" />
      </div>

      {/* Center Backdrop Glow */}
      <div className="w-32 h-32 rounded-full bg-sky-500/10 blur-3xl" />

      {/* Right Action Rail Skeleton */}
      <div className="absolute right-3 bottom-20 md:bottom-12 z-20 flex flex-col items-center gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-9 h-9 rounded-full bg-white/10" />
            <Skeleton className="w-6 h-2 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom Overlay Skeleton */}
      <div className="absolute bottom-20 md:bottom-5 left-3 right-16 z-20 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="w-28 h-4 rounded-md bg-sky-400/20" />
          <Skeleton className="w-12 h-4 rounded-md" />
        </div>
        <Skeleton className="w-3/4 h-6 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="w-12 h-3.5 rounded" />
          <Skeleton className="w-16 h-3.5 rounded" />
          <Skeleton className="w-16 h-3.5 rounded" />
        </div>
        <Skeleton className="w-full h-3.5 rounded" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="flex-1 h-8 rounded-xl bg-sky-500/30" />
          <Skeleton className="w-28 h-8 rounded-xl bg-white/15" />
        </div>
        <Skeleton className="w-full h-1.5 rounded-full" />
      </div>
    </div>
  );
}

export function GridCatalogSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <div className="relative aspect-poster rounded-2xl overflow-hidden bg-white/[0.05] border border-white/5 animate-pulse">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 glass-panel rounded-2xl p-4 border border-white/10 animate-pulse">
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <Skeleton className="w-36 h-6 rounded-lg" />
        <Skeleton className="w-24 h-8 rounded-xl bg-sky-500/20" />
      </div>
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5">
            <Skeleton className="w-10 h-10 rounded-xl flex-none" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="w-48 h-4 rounded" />
              <Skeleton className="w-28 h-3 rounded" />
            </div>
            <Skeleton className="w-16 h-6 rounded-lg" />
            <Skeleton className="w-20 h-7 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TitleDetailSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-pulse select-none">
      {/* Hero Backdrop Video/Banner Skeleton */}
      <div className="relative min-h-[45vh] sm:min-h-[55vh] rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10 flex items-end p-6 sm:p-10">
        <div className="space-y-3 max-w-xl">
          <Skeleton className="w-24 h-6 rounded-lg bg-sky-500/20" />
          <Skeleton className="w-72 sm:w-96 h-10 rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-5 rounded-md" />
            <Skeleton className="w-16 h-5 rounded-md" />
            <Skeleton className="w-16 h-5 rounded-md" />
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="w-32 h-10 rounded-xl bg-sky-500/30" />
            <Skeleton className="w-28 h-10 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* Main Metadata & Details Split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
        <div className="md:col-span-2 space-y-5">
          <div className="space-y-2">
            <Skeleton className="w-40 h-6 rounded-lg" />
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-3/4 h-4 rounded" />
          </div>
          <div className="space-y-3 pt-3">
            <Skeleton className="w-32 h-5 rounded-lg" />
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-16 h-3 rounded" />
                    <Skeleton className="w-12 h-2.5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Poster Card Sidebar Skeleton */}
        <div className="space-y-3">
          <div className="aspect-poster rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
