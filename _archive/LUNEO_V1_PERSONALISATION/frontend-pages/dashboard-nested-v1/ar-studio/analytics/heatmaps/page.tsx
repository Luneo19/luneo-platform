/**
 * AR Studio – Heatmaps (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../components/NotAuthenticatedMessage';
import { HeatmapsPageClient } from './HeatmapsPageClient';

export const metadata = {
  title: 'Heatmaps AR | Luneo',
  description: 'Distribution des angles et zones de placement',
};

export default async function ARHeatmapsPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARHeatmapsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARHeatmapsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
            </div>
          </div>
        }
      >
        <HeatmapsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
