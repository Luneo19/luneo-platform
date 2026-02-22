'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { ModerationQueue } from '@/components/Customizer/admin/ModerationQueue';

function ModerationQueueContent({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="mt-4 text-2xl font-bold">Moderation Queue</h1>
        <p className="text-muted-foreground">Review and approve user-generated designs</p>
      </div>

      <ModerationQueue customizerId={id} />
    </div>
  );
}

export default function ModerationQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="ModerationQueuePage">
      <ModerationQueueContent params={params} />
    </ErrorBoundary>
  );
}
