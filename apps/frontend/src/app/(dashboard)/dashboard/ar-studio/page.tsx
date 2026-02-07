/**
 * ★★★ PAGE - AR STUDIO ★★★
 * Page Server Component pour AR Studio. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ARStudioPageClient } from './ARStudioPageClient';
import { ARSkeleton } from './components/ARSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'AR Studio | Luneo',
  description: 'Gérez vos modèles AR pour Virtual Try-On',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioPage() {
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
    <ErrorBoundary level="page" componentName="ARStudioPage">
      <Suspense fallback={<ARSkeleton />}>
        <ARStudioPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
