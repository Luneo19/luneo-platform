/**
 * Skeleton loading pour la page Products
 */

import { Card, CardContent } from '@/components/ui/card';

export function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-700 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-700 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
                <div className="h-8 w-24 bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700 overflow-hidden">
            <div className="aspect-square bg-gray-900 animate-pulse" />
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-5 w-3/4 bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-700 rounded" />
                <div className="h-6 w-20 bg-gray-700 rounded mt-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


