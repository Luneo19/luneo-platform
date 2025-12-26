'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Page principale /dashboard
 * Redirige vers /overview pour la vue d'ensemble
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/overview');
  }, [router]);

  return (
    <ErrorBoundary componentName="DashboardRedirect">
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection vers le dashboard...</p>
        </div>
      </div>
    </ErrorBoundary>
  );
}

