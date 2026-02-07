/**
 * ★★★ PAGE - LIBRARY ★★★
 * Page Server Component pour la bibliothèque. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LibraryPageClient } from './LibraryPageClient';
import { LibrarySkeleton } from './components/LibrarySkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'Bibliothèque | Luneo',
  description: 'Gérez vos templates et designs',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function LibraryPage() {
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
    <ErrorBoundary level="page" componentName="LibraryPage">
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
