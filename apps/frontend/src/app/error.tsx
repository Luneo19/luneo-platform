'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const err = error instanceof Error ? error : new globalThis.Error(String(error));
    logger.error('Application Error', err, {
      digest: (error as Error & { digest?: string }).digest,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-lg sm:text-xl md:text-2xl lg:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Oups ! Une erreur est survenue
          </h1>
          <p className="text-muted-foreground">
            Nous sommes désolés, quelque chose s'est mal passé. Notre équipe a été notifiée
            et nous travaillons à résoudre le problème.
          </p>
        </div>

        {error.digest && (
          <p className="mb-4 text-sm text-muted-foreground">
            Code d'erreur : <code className="rounded bg-muted px-2 py-1">{error.digest}</code>
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            Réessayer
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = '/')}
          >
            Retour à l'accueil
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 rounded-lg border border-border bg-muted p-4 text-left">
            <summary className="cursor-pointer font-medium">Détails de l'erreur (dev only)</summary>
            <pre className="mt-2 overflow-auto text-xs">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}


