/**
 * ★★★ PAGE - ANALYTICS ★★★
 * Page Server Component pour les analytics
 * 
 * Architecture:
 * - Server Component qui vérifie l'authentification
 * - Client Component pour les interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnalyticsPageClient } from './AnalyticsPageClient';
import { AnalyticsSkeleton } from './components/AnalyticsSkeleton';

export const metadata = {
  title: 'Analytics | Luneo',
  description: 'Analytics et métriques pour optimiser vos performances',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="AnalyticsPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Les données analytics seront fetchées côté client via tRPC
  // Cela permet un meilleur caching et des mises à jour en temps réel

  return (
    <ErrorBoundary level="page" componentName="AnalyticsPage">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
