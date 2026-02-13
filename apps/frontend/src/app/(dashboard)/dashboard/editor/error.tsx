'use client';

import { useEffect } from 'react';
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
    // Log to error reporting service
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          {t('common.errorOccurred')}
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          {t('common.somethingWentWrongWithRetry')}
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700"
        >
          {t('common.retry')}
        </button>
      </div>
    </div>
  );
}
