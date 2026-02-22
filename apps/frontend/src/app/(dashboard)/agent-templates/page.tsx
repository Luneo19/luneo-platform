/**
 * ★★★ PAGE - TEMPLATES ★★★
 * Page Server Component pour les templates
 *
 * Architecture:
 * - Server Component qui vérifie l'authentification via cookies (backend NestJS)
 * - Client Component pour les interactions
 * - Utilise le hook useTemplates pour les données
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TemplatesPageClient } from './TemplatesPageClient';
import { NotAuthenticatedMessage } from '@/components/shared/NotAuthenticatedMessage';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Templates | Luneo',
  description: 'Choisissez parmi notre collection de templates professionnels',
};

function TemplatesSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Chargement des templates...</p>
      </div>
    </div>
  );
}

/**
 * Server Component - Vérifie l'authentification via cookies (backend)
 */
export default async function TemplatesPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(`${getBackendUrl()}/api/v1/auth/me`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <ErrorBoundary level="page" componentName="TemplatesPage">
        <div className="p-6">
          <NotAuthenticatedMessage />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="TemplatesPage">
      <Suspense fallback={<TemplatesSkeleton />}>
        <TemplatesPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
