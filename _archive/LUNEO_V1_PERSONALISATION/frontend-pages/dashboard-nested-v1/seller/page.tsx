/**
 * ★★★ PAGE - SELLER DASHBOARD ★★★
 * Page Server Component pour Seller Dashboard. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
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
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  return (
    <ErrorBoundary level="page" componentName="SellerDashboardPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <SellerPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
