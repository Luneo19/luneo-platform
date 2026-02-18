/**
 * AR Studio – Project Image Targets (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../../components/NotAuthenticatedMessage';
import { TargetsPageClient } from './TargetsPageClient';

export const metadata = {
  title: 'Cibles image | AR Studio | Luneo',
  description: 'Gérer les cibles image du projet AR',
};

export default async function ProjectTargetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ProjectTargetsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  const { id: projectId } = await params;

  return (
    <ErrorBoundary level="page" componentName="ProjectTargetsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <TargetsPageClient projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}
