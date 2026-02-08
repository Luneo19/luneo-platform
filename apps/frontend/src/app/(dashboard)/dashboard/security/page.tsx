/**
 * ★★★ PAGE - SECURITY ★★★
 * Page Server Component pour la gestion de la sécurité
 * Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SecurityPageClient } from './SecurityPageClient';
import { SecuritySkeleton } from './components/SecuritySkeleton';

export const metadata = {
  title: 'Sécurité | Luneo',
  description: 'Gérez la sécurité de votre compte',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function SecurityPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  return (
    <ErrorBoundary level="page" componentName="SecurityPage">
      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
