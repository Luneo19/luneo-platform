/**
 * Marketplace - Browse templates and assets between brands
 */
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MarketplacePageClient } from './MarketplacePageClient';
import { MarketplaceSkeleton } from './MarketplaceSkeleton';

export const metadata = {
  title: 'Marketplace | Luneo',
  description: 'Templates and assets from other brands',
};

export default function MarketplacePage() {
  return (
    <ErrorBoundary level="page" componentName="MarketplacePage">
      <Suspense fallback={<MarketplaceSkeleton />}>
        <MarketplacePageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
