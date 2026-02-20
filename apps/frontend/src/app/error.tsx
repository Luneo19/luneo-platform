'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    logger.error('Route error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen dash-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 dash-gradient-mesh pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" aria-hidden />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {t('common.errorOccurred')}
        </h2>
        <p className="text-white/60 mb-4">
          {t('common.somethingWentWrongWithRetry')}
        </p>

        {/* Error message display */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6 text-left">
          <p className="text-sm font-medium text-white/80 mb-1">Error</p>
          <p className="text-sm text-white/60 break-words font-mono">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-white/40 mt-2">
              Code: <code className="bg-white/10 px-1.5 py-0.5 rounded">{error.digest}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            {t('common.retry')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/15 transition-colors font-medium"
          >
            <Home className="w-4 h-4" aria-hidden />
            Go home
          </Link>
        </div>

        <p className="text-sm text-white/50">
          If this keeps happening,{' '}
          <Link
            href="/help/support"
            className="inline-flex items-center gap-1.5 font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            report the error
          </Link>
        </p>
      </div>
    </div>
  );
}
