import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function CollectionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-gray-800" />
          <Skeleton className="h-4 w-64 bg-gray-800" />
        </div>
        <Skeleton className="h-10 w-40 bg-gray-800" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <Skeleton className="h-4 w-20 bg-gray-700 mb-2" />
            <Skeleton className="h-6 w-16 bg-gray-700" />
          </Card>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 bg-gray-800" />
        <Skeleton className="h-10 w-28 bg-gray-800" />
        <Skeleton className="h-10 w-28 bg-gray-800" />
      </div>

      {/* Collections Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-gray-800/50 border-gray-700">
            <Skeleton className="aspect-square w-full bg-gray-700" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4 bg-gray-700" />
              <Skeleton className="h-4 w-full bg-gray-700" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-4 w-16 bg-gray-700" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

