'use client';

import { useI18n } from '@/i18n/useI18n';
import { CreditCard, Zap, Shield, Star, Crown, Gem } from 'lucide-react';
import { OrbitingCircles, OrbitIcon } from '@/components/ui/premium';

export function PricingHero({
  isYearly,
  onYearlyChange,
}: {
  isYearly: boolean;
  onYearlyChange: (v: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 overflow-hidden">
      {/* Background glow with electric feel */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-500/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-violet-500/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-cyan-500/[0.03] rounded-full blur-[80px]" />
      </div>

      {/* Decorative orbiting elements (desktop) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-30">
        <OrbitingCircles
          radius={300}
          duration={35}
          pathColor="rgba(99, 102, 241, 0.1)"
          pathGlow
        >
          <OrbitIcon glowColor="rgba(99, 102, 241, 0.2)" size={36}>
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </OrbitIcon>
          <OrbitIcon glowColor="rgba(139, 92, 246, 0.2)" size={36}>
            <Crown className="w-4 h-4 text-violet-400" />
          </OrbitIcon>
          <OrbitIcon glowColor="rgba(6, 182, 212, 0.2)" size={36}>
            <Gem className="w-4 h-4 text-cyan-400" />
          </OrbitIcon>
        </OrbitingCircles>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">
              {t('pricing.hero.badge')}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            {t('pricing.hero.title')}{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-editorial italic">
              {t('pricing.hero.titleHighlight')}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-white/50 leading-relaxed">
            {t('pricing.hero.subtitle')}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              14 jours d&apos;essai gratuit sur tous les plans &middot; Sans engagement &middot; Sans carte bancaire
            </span>
          </div>
        </div>

        {/* Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 backdrop-blur-sm">
            <button
              onClick={() => onYearlyChange(false)}
              className={`rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-all duration-200 ${
                !isYearly
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('pricing.hero.monthly')}
            </button>
            <button
              onClick={() => onYearlyChange(true)}
              className={`rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-all duration-200 flex items-center ${
                isYearly
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('pricing.hero.yearly')}
              <span className="ml-2 rounded-full bg-green-500/15 border border-green-500/25 px-2 py-0.5 text-[10px] font-bold text-green-400">
                {t('pricing.hero.discount')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
