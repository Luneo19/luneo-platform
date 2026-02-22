/**
 * ★★★ PAGE - A/B TESTING ★★★
 * Page Server Component pour AB Testing
 * 
 * Architecture:
 * - Server Component qui vérifie l'authentification
 * - Client Component pour les interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ABTestingPageClient } from './ABTestingPageClient';
import { NotAuthenticatedMessage } from '../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'A/B Testing | Luneo',
  description: 'Testez et optimisez vos conversions',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ABTestingPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ABTestingPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ABTestingPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <ABTestingPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
