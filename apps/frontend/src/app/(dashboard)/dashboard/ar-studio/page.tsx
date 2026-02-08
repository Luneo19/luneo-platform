/**
 * ★★★ PAGE - AR STUDIO ★★★
 * Page Server Component pour AR Studio. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ARStudioPageClient } from './ARStudioPageClient';
import { ARSkeleton } from './components/ARSkeleton';

export const metadata = {
  title: 'AR Studio | Luneo',
  description: 'Gérez vos modèles AR pour Virtual Try-On',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function ARStudioPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  return (
    <ErrorBoundary level="page" componentName="ARStudioPage">
      <Suspense fallback={<ARSkeleton />}>
        <ARStudioPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
