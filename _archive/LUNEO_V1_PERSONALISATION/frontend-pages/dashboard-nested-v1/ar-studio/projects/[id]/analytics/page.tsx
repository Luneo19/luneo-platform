/**
 * AR Studio – Project Analytics (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../../components/NotAuthenticatedMessage';
import { ProjectAnalyticsClient } from './ProjectAnalyticsClient';

export const metadata = {
  title: 'Analytics projet | AR Studio | Luneo',
  description: 'Analytics du projet AR',
};

export default async function ProjectAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ProjectAnalyticsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  const { id: projectId } = await params;

  return (
    <ErrorBoundary level="page" componentName="ProjectAnalyticsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
          </div>
        }
      >
        <ProjectAnalyticsClient projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}
