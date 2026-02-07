/**
 * ★★★ PAGE - AR STUDIO LIBRARY ★★★
 * Page Server Component pour AR Studio Library
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
import { ARStudioLibraryPageClient } from './ARStudioLibraryPageClient';

export const metadata = {
  title: 'Bibliothèque AR | Luneo',
  description: 'Gérez vos modèles 3D pour la réalité augmentée',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioLibraryPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioLibraryPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioLibraryPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <ARStudioLibraryPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
