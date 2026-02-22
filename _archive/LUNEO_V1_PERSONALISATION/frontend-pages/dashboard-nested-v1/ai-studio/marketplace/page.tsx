import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { MarketplacePageClient } from './MarketplacePageClient';

export const metadata = {
  title: 'Marketplace | AI Studio | Luneo',
  description: 'Découvrez et partagez des templates de prompts optimisés par la communauté',
};

export default async function MarketplacePage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="MarketplacePage">
        <div className="p-6"><NotAuthenticatedMessage /></div>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary level="page" componentName="MarketplacePage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <MarketplacePageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
