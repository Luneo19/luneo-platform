'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export default function NotFound() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen dash-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 dash-gradient-mesh pointer-events-none" />

      <div className="relative z-10 text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12 text-violet-400" aria-hidden />
        </div>

        <h1 className="text-8xl sm:text-9xl font-bold text-white/10 mb-2">404</h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('errors.pageNotFound')}
        </h2>

        <p className="text-white/60 mb-8">
          {t('errors.pageNotFoundDescription')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-white/20 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t('common.goBack')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
          >
            <Home className="w-4 h-4" aria-hidden />
            {t('common.goHome')}
          </Link>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-left">
          <p className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-400" aria-hidden />
            {t('errors.cantFindPage')}
          </p>
          <p className="text-sm text-white/60 mb-3">
            {t('errors.trySearching')}
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            {t('errors.goToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
