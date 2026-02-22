export function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
}
