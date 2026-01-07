export default function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-16 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}


