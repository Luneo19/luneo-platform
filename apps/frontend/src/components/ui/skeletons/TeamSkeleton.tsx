import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function TeamSkeleton() {
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

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 bg-gray-800" />
        <Skeleton className="h-10 w-32 bg-gray-800" />
      </div>

      {/* Members Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32 bg-gray-700" />
                <Skeleton className="h-4 w-48 bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-700" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-20 bg-gray-700" />
              <Skeleton className="h-8 w-20 bg-gray-700" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

