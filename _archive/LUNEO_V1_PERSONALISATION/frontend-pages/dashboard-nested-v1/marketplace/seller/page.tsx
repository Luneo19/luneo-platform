/**
 * Marketplace Seller Dashboard - List items, stats, list new item
 */
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MarketplaceSellerPageClient } from './MarketplaceSellerPageClient';

export const metadata = {
  title: 'Seller dashboard | Marketplace | Luneo',
  description: 'Manage your marketplace listings',
};

export default function MarketplaceSellerPage() {
  return (
    <ErrorBoundary level="page" componentName="MarketplaceSellerPage">
      <Suspense fallback={<div className="p-6 text-white/60">Loading...</div>}>
        <MarketplaceSellerPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
