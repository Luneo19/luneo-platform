/**
 * ★★★ PAGE - AI STUDIO ★★★
 * Page Server Component pour AI Studio
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
import { AIStudioPageClient } from './AIStudioPageClient';
import { NotAuthenticatedMessage } from '../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'AI Studio | Luneo',
  description: 'Générez des designs avec l\'intelligence artificielle',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function AIStudioPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="AIStudioPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="AIStudioPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <AIStudioPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
