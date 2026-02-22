import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { CollaboratePageClient } from './CollaboratePageClient';

export const metadata = {
  title: 'Collaboration | AI Studio | Luneo',
  description: 'Espaces de travail partagés et générations collaboratives',
};

export default async function CollaboratePage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="CollaboratePage">
        <div className="p-6"><NotAuthenticatedMessage /></div>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary level="page" componentName="CollaboratePage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <CollaboratePageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
