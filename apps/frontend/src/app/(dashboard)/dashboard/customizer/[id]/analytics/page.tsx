'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { CustomizerAnalytics } from '@/components/Customizer/analytics/CustomizerAnalytics';

function CustomizerAnalyticsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/customizer/${id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Customizer
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track performance and user engagement for this customizer</p>
      </div>

      <CustomizerAnalytics customizerId={id} />
    </div>
  );
}

export default function CustomizerAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="CustomizerAnalyticsPage">
      <CustomizerAnalyticsContent params={params} />
    </ErrorBoundary>
  );
}
