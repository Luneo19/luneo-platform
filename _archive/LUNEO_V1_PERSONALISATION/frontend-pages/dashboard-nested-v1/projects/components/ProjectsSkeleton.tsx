/**
 * Skeleton loading for Projects page
 */

import { Card, CardContent } from '@/components/ui/card';

export function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-700 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-700 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-40 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
                <div className="h-8 w-24 bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="animate-pulse flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-700 rounded" />
                  <div className="h-4 w-64 bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-700 rounded" />
                </div>
                <div className="h-8 w-8 bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
