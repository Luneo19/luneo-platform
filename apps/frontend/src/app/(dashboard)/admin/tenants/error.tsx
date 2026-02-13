'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useI18n } from '@/i18n/useI18n';

export default function AdminTenantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    logger.error('Admin Tenants page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">{t('admin.tenants.errorTitle')}</h2>
        <p className="text-gray-400 mb-6">{error.message || t('admin.tenants.errorMessage')}</p>
        <Button onClick={reset} className="bg-cyan-600 hover:bg-cyan-700">
          {t('common.retry')}
        </Button>
      </div>
    </div>
  );
}
