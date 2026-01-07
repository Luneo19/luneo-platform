'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Import page error:', error);
  }, [error]);

  return (
    <ErrorBoundary level="page" componentName="ImportPage">
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
          <p className="text-gray-400 mb-6">{error.message || 'Une erreur est survenue'}</p>
          <Button onClick={reset} className="bg-cyan-600 hover:bg-cyan-700">
            Réessayer
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}


