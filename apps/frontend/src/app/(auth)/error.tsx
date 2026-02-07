'use client';

/**
 * Error Boundary pour les pages d'authentification
 * FE-01: Error handling pour routes critiques
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(
      'Auth page error',
      error instanceof Error ? error : new Error(String(error)),
      { message: error.message, stack: error.stack, digest: error.digest }
    );
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800/50 border-red-500/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              Erreur d'authentification
            </h2>
            <p className="text-muted-foreground">
              {error.message || 'Une erreur inattendue s\'est produite lors de l\'authentification'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
              <Button onClick={reset} variant="default" className="flex-1">
                Réessayer
              </Button>
              <Button
                onClick={() => window.location.href = '/login'}
                variant="outline"
                className="flex-1"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
