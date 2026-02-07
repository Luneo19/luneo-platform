/**
 * ★★★ PAGE - SECURITY ★★★
 * Page Server Component pour la gestion de la sécurité
 * Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SecurityPageClient } from './SecurityPageClient';
import { SecuritySkeleton } from './components/SecuritySkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'Sécurité | Luneo',
  description: 'Gérez la sécurité de votre compte',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function SecurityPage() {
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
    <ErrorBoundary level="page" componentName="SecurityPage">
      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
