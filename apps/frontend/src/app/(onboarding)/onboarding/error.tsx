'use client';

/**
 * Error Boundary pour l'Onboarding
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useI18n } from '@/i18n/useI18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    logger.error('Onboarding page error', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Card className="bg-gray-800/50 border-orange-500/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">
              {t('onboardingError.title')}
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message || t('onboardingError.unexpected')}
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={reset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('onboardingError.retry')}
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                {t('onboardingError.backHome')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
