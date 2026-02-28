'use client';

import React, { useState } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
// AnimatedBorder removed - using clean border styles directly
import { useI18n } from '@/i18n/useI18n';
import type { Plan } from '../data';

export interface PricingPlanCardProps {
  plan: Plan;
  isYearly: boolean;
  onCheckout: (planId: string) => Promise<void>;
}

export function PricingPlanCard({ plan, isYearly, onCheckout }: PricingPlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const price = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;
  const displayPrice =
    price === null || price === undefined
      ? t('pricing.card.onRequest')
      : price === 0
        ? t('pricing.card.free')
        : `${Math.round(price)}€`;
  const period =
    price === null || price === undefined || price === 0 ? '' : t('pricing.card.perMonth');
  const yearlyNote =
    isYearly && price && price > 0 ? t('pricing.card.billedYearly', { amount: String(plan.priceYearly) }) : null;

  const handleClick = async () => {
    if (plan.id === 'free') {
      window.location.href = plan.ctaHref || '/register';
      return;
    }
    if (plan.id === 'enterprise') {
      window.location.href = plan.ctaHref || '/contact?plan=enterprise&source=pricing';
      return;
    }
    setIsLoading(true);
    try {
      await onCheckout(plan.id);
    } catch (error: unknown) {
      logger.error(t('pricing.card.checkoutError'), error);
      const err = error as { message?: string; error?: string };
      const errorMessage =
        err?.message || err?.error || t('errors.generic');
      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('max requests')
      ) {
        toast({
          title: t('pricing.card.rateLimit'),
          description: t('pricing.card.rateLimitDesc'),
          variant: 'destructive',
        });
      } else if (
        errorMessage.includes('Configuration') ||
        errorMessage.includes('Stripe')
      ) {
        toast({
          title: t('pricing.card.configError'),
          description: t('pricing.card.configErrorDesc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('pricing.card.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cardContent = (
    <>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-white">{plan.name}</h3>
        <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold text-white font-editorial tabular-nums">{displayPrice}</span>
          {period && <span className="text-sm text-white/90">{period}</span>}
        </div>
        {yearlyNote && (
          <p className="mt-1 text-xs text-white/90">{yearlyNote}</p>
        )}
        {isYearly &&
          price !== null &&
          price !== undefined &&
          price > 0 && (
            <p className="mt-1 text-xs font-medium text-green-400">
              {t('pricing.card.save20')}
            </p>
          )}
        {price !== null && price !== undefined && price > 0 && plan.id !== 'enterprise' && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">14 jours d&apos;essai gratuit</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full font-semibold text-sm h-10 sm:h-11 rounded-lg transition-all duration-200 ${
          plan.popular
            ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-white/[0.12] text-white hover:bg-white/[0.18] border border-white/[0.16]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('pricing.card.loading')}
          </>
        ) : (
          plan.cta
        )}
      </Button>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <Check className="h-4 w-4 flex-shrink-0 text-green-400 mt-0.5" />
            <span className="text-xs sm:text-sm text-white/95 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full"
    >
      <div
        className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${
          plan.popular
            ? 'bg-gradient-to-b from-indigo-500/[0.06] to-transparent border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.08)]'
            : 'border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
        }`}
      >
        {cardContent}
      </div>
    </motion>
  );
}
