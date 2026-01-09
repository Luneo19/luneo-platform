export default function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-16 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}



