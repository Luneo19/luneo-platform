/**
 * Skeleton de chargement pour Library Import
 */

'use client';

import { Card } from '@/components/ui/card';

export function ImportSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
      <div className="dash-card h-64 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
      <div className="space-y-3">
        <div className="h-6 w-48 bg-white/[0.06] rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="dash-card p-4 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/[0.06] rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2 animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/[0.06] rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
