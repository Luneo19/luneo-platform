/**
 * Skeleton de chargement pour AR Studio
 */

'use client';

import { Card } from '@/components/ui/card';

export function ARSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-16 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="h-8 w-8 bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-4 w-20 bg-gray-700 rounded mb-1 animate-pulse" />
            <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
          </Card>
        ))}
      </div>
      <div className="h-20 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="aspect-square bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-700 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}



