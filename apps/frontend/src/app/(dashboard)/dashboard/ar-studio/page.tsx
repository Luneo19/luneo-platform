/**
 * ★★★ PAGE - AR STUDIO ★★★
 * Page Server Component pour AR Studio
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
import { ARStudioPageClient } from './ARStudioPageClient';
import { ARSkeleton } from './components/ARSkeleton';

export const metadata = {
  title: 'AR Studio | Luneo',
  description: 'Gérez vos modèles AR pour Virtual Try-On',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioPage">
      <Suspense fallback={<ARSkeleton />}>
        <ARStudioPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
