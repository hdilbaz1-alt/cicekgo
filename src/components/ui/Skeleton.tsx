'use client';

import React from 'react';

/** Tek bir iskelet blok */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/** Liste/kart yükleme iskeleti (mobil kartlar + masaüstü satırlar için ortak) */
export function SkeletonList({ rows = 6, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
          <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Kart ızgarası iskeleti */
export function SkeletonCards({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-3xl" />
      ))}
    </div>
  );
}

/** Boş durum: ikon + başlık + açıklama + opsiyonel aksiyon */
export function EmptyState({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 sm:p-16 text-center flex flex-col items-center">
      {icon && <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {hint && <p className="text-sm text-slate-400 mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
