import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function OrdersSkeleton() {
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
        <Skeleton className="h-10 w-32 bg-gray-800" />
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-20 bg-gray-700 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 bg-gray-700" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-6 w-24 bg-gray-700" />
                <Skeleton className="h-8 w-20 bg-gray-700" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

