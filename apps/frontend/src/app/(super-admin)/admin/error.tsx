'use client';

/**
 * Error Boundary pour l'Admin Super-Admin
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldAlert } from 'lucide-react';
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
    logger.error('Admin page error', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <Card className="bg-gray-800/50 border-red-500/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-12 w-12 text-red-400" />
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Erreur dans le panneau d'administration
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message || 'Une erreur inattendue s\'est produite'}
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={reset} variant="default">
                Réessayer
              </Button>
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
              >
                Retour à l'admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
