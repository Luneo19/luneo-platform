/**
 * ★★★ PAGE - GESTION PRODUITS (REFACTORED) ★★★
 * Page Server Component pour la gestion des produits
 * 
 * Architecture:
 * - Server Component par défaut
 * - Client Component minimal pour interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProductsPageClient } from './ProductsPageClient';
import { ProductsSkeleton } from './components/ProductsSkeleton';

export const metadata = {
  title: 'Produits | Luneo',
  description: 'Gérez vos produits et votre catalogue',
};

/**
 * Server Component - Page principale
 */
export default function ProductsPage() {
  return (
    <ErrorBoundary level="page" componentName="ProductsPage">
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
