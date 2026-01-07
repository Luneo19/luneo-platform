/**
 * ★★★ PAGE - AR STUDIO PREVIEW ★★★
 * Page Server Component pour AR Studio Preview
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
import { ARStudioPreviewPageClient } from './ARStudioPreviewPageClient';

export const metadata = {
  title: 'Prévisualisation AR | Luneo',
  description: 'Testez vos modèles 3D en réalité augmentée',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioPreviewPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="ARStudioPreviewPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioPreviewPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <ARStudioPreviewPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
