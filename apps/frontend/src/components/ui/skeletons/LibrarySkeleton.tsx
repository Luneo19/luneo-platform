import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function LibrarySkeleton() {
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
          <Skeleton className="h-10 w-32 bg-gray-800" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 bg-gray-800" />
        ))}
      </div>

      {/* Templates Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-gray-800/50 border-gray-700">
            <Skeleton className="aspect-square w-full bg-gray-700" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-full bg-gray-700" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-4 w-16 bg-gray-700" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
                <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
                <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

