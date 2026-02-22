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
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ImportPageClient } from './ImportPageClient';
import { ImportSkeleton } from './components/ImportSkeleton';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { fr } from '@/i18n/locales';

export const metadata = {
  title: `${fr.common.importFiles} | Luneo`,
  description: 'Importez vos templates et designs dans la bibliothèque',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ImportPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="ImportPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
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
