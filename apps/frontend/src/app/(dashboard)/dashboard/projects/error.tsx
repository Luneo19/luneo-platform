'use client';

/**
 * Error boundary for Projects page
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, FolderKanban, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Projects page error', {
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
            <div className="relative">
              <FolderKanban className="h-12 w-12 text-gray-400" />
              <AlertCircle className="h-5 w-5 text-red-400 absolute -top-1 -right-1" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Erreur lors du chargement des projets
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message || 'Nous n\'avons pas pu charger vos projets. Veuillez réessayer.'}
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={reset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={() => (window.location.href = '/dashboard')}
                variant="outline"
              >
                Retour au dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
