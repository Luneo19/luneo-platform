/**
 * ★★★ PAGE - LIBRARY IMPORT ★★★
 * Page Server Component pour l'import de fichiers
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
import { ImportPageClient } from './ImportPageClient';
import { ImportSkeleton } from './components/ImportSkeleton';

export const metadata = {
  title: 'Importer des fichiers | Luneo',
  description: 'Importez vos templates et designs dans la bibliothèque',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ImportPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="ImportPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ImportPage">
      <Suspense fallback={<ImportSkeleton />}>
        <ImportPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
