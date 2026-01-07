/**
 * ★★★ PAGE - TEMPLATES ★★★
 * Page Server Component pour les templates
 * 
 * Architecture:
 * - Server Component qui vérifie l'authentification
 * - Client Component pour les interactions
 * - Utilise le hook useTemplates pour les données
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TemplatesPageClient } from './TemplatesPageClient';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Templates | Luneo',
  description: 'Choisissez parmi notre collection de templates professionnels',
};

function TemplatesSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Chargement des templates...</p>
      </div>
    </div>
  );
}

/**
 * Server Component - Vérifie l'authentification
 */
export default async function TemplatesPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="TemplatesPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="TemplatesPage">
      <Suspense fallback={<TemplatesSkeleton />}>
        <TemplatesPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
