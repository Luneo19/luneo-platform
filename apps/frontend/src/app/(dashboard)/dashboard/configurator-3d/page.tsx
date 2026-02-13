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
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Configurator3DPageClient } from './Configurator3DPageClient';
import { Configurator3DSkeleton } from './Configurator3DSkeleton';
import { NotAuthenticatedMessage } from '../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'Configurateur 3D | Luneo',
  description: 'Personnalisez votre produit en 3D',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function Configurator3DPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="Configurator3DPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
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
