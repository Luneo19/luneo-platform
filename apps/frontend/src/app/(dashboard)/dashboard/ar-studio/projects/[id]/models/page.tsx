/**
 * AR Studio – Project Models (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../../components/NotAuthenticatedMessage';
import { ModelsPageClient } from './ModelsPageClient';

export const metadata = {
  title: 'Modèles 3D | AR Studio | Luneo',
  description: 'Gérer les modèles 3D du projet AR',
};

export default async function ProjectModelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ProjectModelsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  const { id: projectId } = await params;

  return (
    <ErrorBoundary level="page" componentName="ProjectModelsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-56 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <ModelsPageClient projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}
