import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { BulkGenerationPageClient } from './BulkGenerationPageClient';

export const metadata = {
  title: 'Bulk Generation | AI Studio | Luneo',
  description: 'Génération en masse avec templates et variables CSV',
};

export default async function BulkGenerationPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="BulkGenerationPage">
        <div className="p-6"><NotAuthenticatedMessage /></div>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary level="page" componentName="BulkGenerationPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <BulkGenerationPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
