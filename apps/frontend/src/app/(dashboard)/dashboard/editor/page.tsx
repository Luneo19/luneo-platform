/**
 * ★★★ PAGE - EDITOR ★★★
 * Page Server Component pour Editor
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
import { EditorPageClient } from './EditorPageClient';

export const metadata = {
  title: 'Éditeur de Design | Luneo',
  description: 'Éditeur de design professionnel',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function EditorPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="EditorPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="EditorPage">
      <Suspense fallback={<div className="h-screen bg-gray-900"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <EditorPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
