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
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <AnalyticsAdvancedPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
