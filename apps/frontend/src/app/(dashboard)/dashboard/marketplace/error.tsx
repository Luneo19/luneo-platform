'use client';

import { useI18n } from '@/i18n/useI18n';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function MarketplaceError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <h2 className="text-xl font-semibold">{t('common.somethingWentWrong')}</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>{t('common.retry')}</Button>
    </div>
  );
}
