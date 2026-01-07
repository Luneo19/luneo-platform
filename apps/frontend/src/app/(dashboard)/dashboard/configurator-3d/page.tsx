/**
 * ★★★ PAGE - CONFIGURATOR 3D ★★★
 * Page Server Component pour le configurateur 3D
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
import { Configurator3DPageClient } from './Configurator3DPageClient';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Configurateur 3D | Luneo',
  description: 'Personnalisez votre produit en 3D',
};

function Configurator3DSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Chargement du configurateur 3D...</p>
      </div>
    </div>
  );
}

/**
 * Server Component - Vérifie l'authentification
 */
export default async function Configurator3DPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="Configurator3DPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="Configurator3DPage">
      <Suspense fallback={<Configurator3DSkeleton />}>
        <Configurator3DPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
