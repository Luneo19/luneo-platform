/**
 * ★★★ PAGE - SELLER DASHBOARD ★★★
 * Page Server Component pour Seller Dashboard. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SellerPageClient } from './SellerPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'Seller Dashboard | Luneo',
  description: 'Gérez vos ventes, produits et paiements',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function SellerDashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  if (!accessToken) redirect('/login');

  const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const user = userRes.ok ? await userRes.json() : null;
  if (!user) redirect('/login');

  return (
    <ErrorBoundary level="page" componentName="SellerDashboardPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <SellerPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
