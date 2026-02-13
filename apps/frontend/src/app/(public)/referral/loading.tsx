export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 space-y-6">
      <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" style={{ width: `${Math.random() * 40 + 60}%` }} />
        ))}
      </div>
    </div>
  );
}
