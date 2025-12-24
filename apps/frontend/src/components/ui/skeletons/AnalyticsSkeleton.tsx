import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-gray-800" />
          <Skeleton className="h-4 w-64 bg-gray-800" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 bg-gray-800" />
          <Skeleton className="h-10 w-28 bg-gray-800" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 bg-gray-700" />
              <Skeleton className="h-5 w-5 rounded bg-gray-700" />
            </div>
            <Skeleton className="h-8 w-32 bg-gray-700 mb-2" />
            <Skeleton className="h-4 w-20 bg-gray-700" />
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <Skeleton className="h-6 w-48 bg-gray-700 mb-6" />
        <Skeleton className="h-64 w-full bg-gray-700 rounded" />
      </Card>

      {/* Additional Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
            <Skeleton className="h-6 w-32 bg-gray-700 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-16 bg-gray-700" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

