/**
 * ★★★ PAGE - EDITOR ★★★
 * Page Server Component pour Editor. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EditorPageClient } from './EditorPageClient';

export const metadata = {
  title: 'Éditeur de Design | Luneo',
  description: 'Éditeur de design professionnel',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function EditorPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  return (
    <ErrorBoundary level="page" componentName="EditorPage">
      <Suspense fallback={<div className="h-screen"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <EditorPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
