'use client';

/**
 * Customize Page - Client Component
 * 
 * Page principale de gestion des produits personnalisables
 * Architecture: Client Component pour interactions et animations
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamic import du Client Component (librairie motion non SSR-safe)
const CustomizePageClient = dynamic(
  () => import('./CustomizePageClient').then(mod => ({ default: mod.CustomizePageClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Chargement de la page de personnalisation...</p>
        </div>
      </div>
    ),
  }
);

export default function CustomizePage() {
  return (
    <ErrorBoundary componentName="CustomizePage">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white/60">Chargement...</p>
            </div>
          </div>
        }
      >
        <CustomizePageClient />
      </Suspense>
    </ErrorBoundary>
  );
}

