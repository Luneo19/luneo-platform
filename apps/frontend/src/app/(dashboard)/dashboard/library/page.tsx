/**
 * ★★★ PAGE - LIBRARY ★★★
 * Page Server Component pour la bibliothèque. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LibraryPageClient } from './LibraryPageClient';
import { LibrarySkeleton } from './components/LibrarySkeleton';

export const metadata = {
  title: 'Bibliothèque | Luneo',
  description: 'Gérez vos templates et designs',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function LibraryPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  return (
    <ErrorBoundary level="page" componentName="LibraryPage">
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
