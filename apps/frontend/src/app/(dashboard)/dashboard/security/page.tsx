/**
 * ★★★ PAGE - SECURITY ★★★
 * Page Server Component pour la gestion de la sécurité
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
import { SecurityPageClient } from './SecurityPageClient';
import { SecuritySkeleton } from './components/SecuritySkeleton';

export const metadata = {
  title: 'Sécurité | Luneo',
  description: 'Gérez la sécurité de votre compte',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function SecurityPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="SecurityPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="SecurityPage">
      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
