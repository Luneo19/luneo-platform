/**
 * ★★★ ENHANCED SKELETON COMPONENTS ★★★
 * Composants de skeleton améliorés avec animations fluides
 * Utilisés pour les états de chargement dans tout le dashboard
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton de base amélioré avec animation fluide
 */
export function EnhancedSkeleton({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] animate-[shimmer_2s_infinite]';
  
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      }}
      {...props}
    />
  );
}

/**
 * Skeleton pour une carte de produit améliorée
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <EnhancedSkeleton variant="rectangular" className="w-full h-48" />
      <div className="p-4 space-y-3">
        <EnhancedSkeleton variant="text" className="h-5 w-3/4" />
        <EnhancedSkeleton variant="text" className="h-4 w-full" />
        <EnhancedSkeleton variant="text" className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <EnhancedSkeleton variant="text" className="h-6 w-20" />
          <EnhancedSkeleton variant="rectangular" className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour une carte de métrique dashboard
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <EnhancedSkeleton variant="text" className="h-4 w-24" />
        <EnhancedSkeleton variant="circular" className="h-8 w-8" />
      </div>
      <EnhancedSkeleton variant="text" className="h-8 w-32 mb-2" />
      <EnhancedSkeleton variant="text" className="h-3 w-20" />
    </div>
  );
}

/**
 * Skeleton pour une table améliorée
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <EnhancedSkeleton variant="text" className="h-6 w-32" />
          <EnhancedSkeleton variant="rectangular" className="h-9 w-24 rounded-md" />
        </div>
      </div>
      <div className="divide-y divide-slate-700/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <EnhancedSkeleton variant="circular" className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <EnhancedSkeleton variant="text" className="h-4 w-3/4" />
              <EnhancedSkeleton variant="text" className="h-3 w-1/2" />
            </div>
            <EnhancedSkeleton variant="rectangular" className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton pour un graphique amélioré
 */
export function ChartSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <EnhancedSkeleton variant="text" className="h-6 w-48" />
        <EnhancedSkeleton variant="rectangular" className="h-9 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        <EnhancedSkeleton variant="rectangular" className="h-64 w-full rounded-md" />
        <div className="flex items-center justify-center gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <EnhancedSkeleton variant="circular" className="h-3 w-3" />
              <EnhancedSkeleton variant="text" className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour un formulaire amélioré
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton variant="text" className="h-4 w-24" />
          <EnhancedSkeleton variant="rectangular" className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex items-center justify-end gap-3 pt-4">
        <EnhancedSkeleton variant="rectangular" className="h-10 w-24 rounded-md" />
        <EnhancedSkeleton variant="rectangular" className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

// Ajouter l'animation shimmer dans le CSS global si nécessaire
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
