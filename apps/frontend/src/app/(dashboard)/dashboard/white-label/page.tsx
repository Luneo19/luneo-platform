/**
 * White-Label Configuration Page
 * Dashboard page for brands to configure white-label settings.
 * Requires Business plan or higher.
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WhiteLabelPageClient } from './WhiteLabelPageClient';
import { NotAuthenticatedMessage } from '../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'White-Label | Luneo',
  description: 'Configure your brand identity and white-label settings',
};

export default async function WhiteLabelPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="WhiteLabelPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="WhiteLabelPage">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <WhiteLabelPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
