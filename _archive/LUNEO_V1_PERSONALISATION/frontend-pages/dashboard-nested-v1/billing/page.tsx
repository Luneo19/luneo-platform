/**
 * ★★★ PAGE - BILLING ★★★
 * Page Server Component pour la gestion de la facturation
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
import { BillingPageClient } from './BillingPageClient';
import { BillingSkeleton } from './components/BillingSkeleton';
import { NotAuthenticatedMessage } from '../components/NotAuthenticatedMessage';

export const metadata = {
  title: 'Facturation | Luneo',
  description: 'Gérez votre abonnement et vos factures',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function BillingPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="BillingPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="BillingPage">
      <Suspense fallback={<BillingSkeleton />}>
        <BillingPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
