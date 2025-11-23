import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DesignDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded bg-gray-800" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-gray-800" />
            <Skeleton className="h-4 w-48 bg-gray-800" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 bg-gray-800" />
          <Skeleton className="h-10 w-32 bg-gray-800" />
        </div>
      </div>

      {/* Design Preview & Info Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <Skeleton className="aspect-square w-full rounded-lg bg-gray-700" />
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <Skeleton className="h-6 w-32 bg-gray-700 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 bg-gray-700 mb-1" />
                  <Skeleton className="h-5 w-32 bg-gray-700" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <Skeleton className="h-6 w-24 bg-gray-700 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-gray-700" />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Versions Timeline Skeleton */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-48 bg-gray-700 mb-2" />
            <Skeleton className="h-4 w-32 bg-gray-700" />
          </div>
          <Skeleton className="h-10 w-32 bg-gray-700" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32 bg-gray-700" />
                <Skeleton className="h-4 w-48 bg-gray-700" />
              </div>
              <Skeleton className="h-8 w-24 bg-gray-700" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

