export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
