/**
 * ★★★ PAGE - LIBRARY ★★★
 * Page Server Component pour la bibliothèque
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
import { LibraryPageClient } from './LibraryPageClient';
import { LibrarySkeleton } from './components/LibrarySkeleton';

export const metadata = {
  title: 'Bibliothèque | Luneo',
  description: 'Gérez vos templates et designs',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function LibraryPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="LibraryPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="LibraryPage">
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
