/**
 * ★★★ PAGE - AI STUDIO TEMPLATES ★★★
 * Page Server Component pour AI Studio Templates
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
import { AITemplatesPageClient } from './AITemplatesPageClient';

export const metadata = {
  title: 'AI Studio Templates | Luneo',
  description: 'Bibliothèque de templates générés par IA',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function AIStudioTemplatesPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="AIStudioTemplatesPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="AIStudioTemplatesPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <AITemplatesPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
