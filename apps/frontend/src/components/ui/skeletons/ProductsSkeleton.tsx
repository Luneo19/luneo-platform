import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 bg-gray-800" />
          <Skeleton className="h-4 w-32 bg-gray-800" />
        </div>
        <Skeleton className="h-10 w-36 bg-gray-800" />
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 bg-gray-800" />
        <Skeleton className="h-10 w-28 bg-gray-800" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-gray-800/50 border-gray-700">
            <Skeleton className="aspect-square w-full bg-gray-700" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4 bg-gray-700" />
              <Skeleton className="h-4 w-1/2 bg-gray-700" />
              <Skeleton className="h-6 w-20 bg-gray-700" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

