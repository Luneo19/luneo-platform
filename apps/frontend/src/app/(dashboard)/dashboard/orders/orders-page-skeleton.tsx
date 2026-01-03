/**
 * Skeleton loader pour la page Orders
 */

export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-700 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-700 rounded" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="animate-pulse">
        <div className="h-16 bg-gray-800 rounded-lg" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

