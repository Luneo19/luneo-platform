/**
 * AR Studio – Sessions List (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../components/NotAuthenticatedMessage';
import { SessionsPageClient } from './SessionsPageClient';

export const metadata = {
  title: 'Sessions AR | Luneo',
  description: 'Liste des sessions AR',
};

export default async function ARSessionsPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARSessionsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARSessionsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="h-96 rounded-xl bg-white/10 animate-pulse" />
          </div>
        }
      >
        <SessionsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
