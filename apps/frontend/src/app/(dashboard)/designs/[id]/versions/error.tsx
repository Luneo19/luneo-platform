'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function DesignVersionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Design versions page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Erreur - Versions du design</h2>
        <p className="text-gray-400 mb-6">{error.message || 'Une erreur est survenue sur la page Versions du design'}</p>
        <Button onClick={reset} className="bg-cyan-600 hover:bg-cyan-700">
          Réessayer
        </Button>
      </div>
    </div>
  );
}
