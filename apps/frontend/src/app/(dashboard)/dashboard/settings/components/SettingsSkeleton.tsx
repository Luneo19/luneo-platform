/**
 * Skeleton de chargement pour Settings
 */

'use client';

import { Card } from '@/components/ui/card';

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="h-16 bg-gray-800 rounded animate-pulse" />

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>

      {/* Content Skeleton */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    </div>
  );
}



