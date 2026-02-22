/**
 * AR Studio – Global Analytics Dashboard (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { AnalyticsDashboardClient } from './AnalyticsDashboardClient';

export const metadata = {
  title: 'Analytics AR | Luneo',
  description: 'Tableau de bord analytics AR global',
};

export default async function ARAnalyticsDashboardPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARAnalyticsDashboardPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARAnalyticsDashboardPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
            </div>
          </div>
        }
      >
        <AnalyticsDashboardClient />
      </Suspense>
    </ErrorBoundary>
  );
}
