'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    // Log to error reporting service
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">{t('common.errorOccurred')}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || t('common.somethingWentWrongWithRetry')}
      </p>
      <Button onClick={reset} variant="outline">{t('common.retry')}</Button>
    </div>
  );
}
