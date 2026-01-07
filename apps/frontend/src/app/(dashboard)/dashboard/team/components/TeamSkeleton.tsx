/**
 * Skeleton de chargement pour Team
 */

'use client';

import { Card } from '@/components/ui/card';

export function TeamSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-10 w-40 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="h-8 w-16 bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
          </Card>
        ))}
      </div>

      {/* Members Skeleton */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    </div>
  );
}


