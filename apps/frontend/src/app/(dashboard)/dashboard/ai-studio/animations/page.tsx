/**
 * ★★★ PAGE - AI STUDIO ANIMATIONS ★★★
 * Page Server Component pour AI Studio Animations
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
import { AIStudioAnimationsPageClient } from './AIStudioAnimationsPageClient';

export const metadata = {
  title: 'Animations IA | Luneo',
  description: "Générez des animations avec l'intelligence artificielle",
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function AIStudioAnimationsPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="AIStudioAnimationsPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="AIStudioAnimationsPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <AIStudioAnimationsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
