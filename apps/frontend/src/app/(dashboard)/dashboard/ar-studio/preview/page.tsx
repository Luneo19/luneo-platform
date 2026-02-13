/**
 * ★★★ PAGE - AR STUDIO PREVIEW ★★★
 * Page Server Component pour AR Studio Preview
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
import { ARStudioPreviewPageClient } from './ARStudioPreviewPageClient';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'Prévisualisation AR | Luneo',
  description: 'Testez vos modèles 3D en réalité augmentée',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioPreviewPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioPreviewPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioPreviewPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <ARStudioPreviewPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
