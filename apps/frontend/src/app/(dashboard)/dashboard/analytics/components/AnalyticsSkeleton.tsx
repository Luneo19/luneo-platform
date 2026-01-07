/**
 * Skeleton de chargement pour Analytics
 */

'use client';

import { Card } from '@/components/ui/card';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </Card>

      {/* KPIs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="h-8 w-8 bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="h-4 w-24 bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="p-6">
          <div className="h-6 w-48 bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="h-64 bg-gray-700 rounded animate-pulse" />
        </div>
      </Card>
    </div>
  );
}


