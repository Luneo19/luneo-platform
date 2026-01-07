/**
 * ★★★ PAGE - SELLER DASHBOARD ★★★
 * Page Server Component pour Seller Dashboard
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
import { SellerPageClient } from './SellerPageClient';

export const metadata = {
  title: 'Seller Dashboard | Luneo',
  description: 'Gérez vos ventes, produits et paiements',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function SellerDashboardPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="SellerDashboardPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="SellerDashboardPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <SellerPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
