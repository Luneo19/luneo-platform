/**
 * AR Studio – Conversions Funnel (Server)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../../components/NotAuthenticatedMessage';
import { ConversionsPageClient } from './ConversionsPageClient';

export const metadata = {
  title: 'Conversions AR | Luneo',
  description: 'Entonnoir de conversion AR',
};

export default async function ARConversionsPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARConversionsPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARConversionsPage">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
            <div className="h-80 rounded-xl bg-white/10 animate-pulse" />
          </div>
        }
      >
        <ConversionsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
