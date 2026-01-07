/**
 * Skeleton de chargement pour Billing
 */

'use client';

import { Card } from '@/components/ui/card';

export function BillingSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-16 bg-gray-800 rounded animate-pulse" />
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
          <div className="h-6 w-48 bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="h-32 bg-gray-700 rounded animate-pulse" />
        </Card>
      ))}
    </div>
  );
}


