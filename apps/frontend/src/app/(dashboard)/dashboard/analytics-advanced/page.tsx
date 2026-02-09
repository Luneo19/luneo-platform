/**
 * ★★★ PAGE - ANALYTICS ADVANCED ★★★
 * Page Server Component pour Analytics Advanced
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
import { AnalyticsAdvancedPageClient } from './AnalyticsAdvancedPageClient';

export const metadata = {
  title: 'Analytics Avancées | Luneo',
  description: 'Analyses approfondies : Funnels, Cohortes, Segments',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function AnalyticsAdvancedPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="AnalyticsAdvancedPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="AnalyticsAdvancedPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse" /></div>}>
        <AnalyticsAdvancedPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
