/**
 * ★★★ PAGE - TEAM ★★★
 * Page Server Component pour la gestion d'équipe
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
import { TeamPageClient } from './TeamPageClient';
import { TeamSkeleton } from './components/TeamSkeleton';

export const metadata = {
  title: 'Équipe | Luneo',
  description: 'Gérez les membres de votre équipe',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function TeamPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="TeamPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Les données de l'équipe seront fetchées côté client via tRPC
  // Cela permet un meilleur caching et des mises à jour en temps réel

  return (
    <ErrorBoundary level="page" componentName="TeamPage">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
