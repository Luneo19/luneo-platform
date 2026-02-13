'use client';

/**
 * Error Boundary pour le Dashboard
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useI18n } from '@/i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const err = error instanceof Error ? error : new globalThis.Error(String(error));
    logger.error('Dashboard page error', err, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      digest: (error as Error & { digest?: string }).digest,
    });
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <Card className="bg-gray-800/50 border-red-500/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              {t('common.errorOccurred')}
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message || t('common.somethingWentWrongWithRetry')}
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={reset} variant="default">
                {t('common.retry')}
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                {t('common.reload')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



