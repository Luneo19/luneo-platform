'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function View3dError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('3D View page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Erreur - Vue 3D</h2>
        <p className="text-gray-400 mb-6">{error.message || 'Une erreur est survenue sur la page Vue 3D'}</p>
        <Button onClick={reset} className="bg-cyan-600 hover:bg-cyan-700">
          Réessayer
        </Button>
      </div>
    </div>
  );
}
