/**
 * ★★★ PAGE - EDITOR ★★★
 * Page Server Component pour Editor. Cookie-based auth with NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EditorPageClient } from './EditorPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'Éditeur de Design | Luneo',
  description: 'Éditeur de design professionnel',
};

/**
 * Server Component - Vérifie l'authentification
 */
export default async function EditorPage() {
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
    <ErrorBoundary level="page" componentName="EditorPage">
      <Suspense fallback={<div className="h-screen bg-gray-900"><div className="h-16 bg-gray-800 rounded animate-pulse" /></div>}>
        <EditorPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
