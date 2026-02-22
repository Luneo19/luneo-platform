import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function MarketplaceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-10 w-64 rounded bg-white/10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-white/10">
            <div className="aspect-video bg-white/10 animate-pulse" />
            <CardHeader className="pb-2">
              <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse mt-2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
