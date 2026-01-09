'use client';

/**
 * Error Boundary pour le Dashboard
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Dashboard page error', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
    // Envoyer à Sentry si configuré
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <Card className="bg-gray-800/50 border-red-500/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              Erreur lors du chargement du dashboard
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message || 'Une erreur inattendue s\'est produite'}
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={reset} variant="default">
                Réessayer
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                Recharger la page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



