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
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <AITemplatesPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
