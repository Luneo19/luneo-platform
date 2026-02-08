/**
 * ★★★ PAGE - AR STUDIO COLLABORATION ★★★
 * Page Server Component pour AR Studio Collaboration
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
import { ARCollaborationPageClient } from './ARCollaborationPageClient';

export const metadata = {
  title: 'AR Studio Collaboration | Luneo',
  description: 'Travaillez en équipe sur vos modèles AR',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioCollaborationPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioCollaborationPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioCollaborationPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <ARCollaborationPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
