/**
 * ★★★ PAGE - AR STUDIO INTEGRATIONS ★★★
 * Page Server Component pour AR Studio Integrations
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
import { ARIntegrationsPageClient } from './ARIntegrationsPageClient';

export const metadata = {
  title: 'AR Studio Integrations | Luneo',
  description: 'Connectez vos plateformes pour synchroniser vos modèles AR',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioIntegrationsPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioIntegrationsPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioIntegrationsPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <ARIntegrationsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
