'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export function PricingCTA() {
  const { t } = useI18n();

  return (
    <section className="relative border-t border-white/[0.04] py-16 sm:py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          {t('pricing.cta.title')}{' '}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-editorial italic">
            {t('pricing.cta.titleHighlight')}
          </span>
          {' '}{t('pricing.cta.titleEnd')}
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
          {t('pricing.cta.subtitle')}
        </p>
        <Link href="/contact?plan=enterprise&source=pricing" className="mt-8 inline-block">
          <button className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5">
            {t('pricing.cta.button')}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </Link>
      </div>
    </section>
  );
}
