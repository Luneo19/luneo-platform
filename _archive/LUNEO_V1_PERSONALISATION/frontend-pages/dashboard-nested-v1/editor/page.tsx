/**
 * Editor page - Visual editor (Canva-like). Server wrapper + client editor.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EditorPageClient } from './EditorPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Visual Editor | Luneo',
  description: 'Create designs with the Luneo visual editor',
};

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
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-zinc-950">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        }
      >
        <EditorPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
