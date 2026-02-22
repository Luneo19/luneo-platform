/**
 * Skeleton de chargement pour Security
 */

'use client';

import { Card } from '@/components/ui/card';

export function SecuritySkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />

      {/* Sections Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="dash-card p-6 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <div className="h-6 w-48 bg-white/[0.06] rounded mb-4 animate-pulse" />
          <div className="h-4 w-96 bg-white/[0.06] rounded mb-6 animate-pulse" />
          <div className="h-32 bg-white/[0.06] rounded animate-pulse" />
        </Card>
      ))}
    </div>
  );
}
