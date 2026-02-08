/**
 * Skeleton de chargement pour Security
 */

'use client';

import { Card } from '@/components/ui/card';

export function SecuritySkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="h-16 bg-gray-100 rounded animate-pulse" />

      {/* Sections Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 bg-white border-gray-200">
          <div className="h-6 w-48 bg-gray-100 rounded mb-4 animate-pulse" />
          <div className="h-4 w-96 bg-gray-100 rounded mb-6 animate-pulse" />
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </Card>
      ))}
    </div>
  );
}



