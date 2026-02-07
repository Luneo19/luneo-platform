'use client';

import React, { useState } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import type { Plan } from '../data';

export interface PricingPlanCardProps {
  plan: Plan;
  isYearly: boolean;
  onCheckout: (planId: string) => Promise<void>;
}

export function PricingPlanCard({ plan, isYearly, onCheckout }: PricingPlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const price = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;
  const displayPrice =
    price === null || price === undefined
      ? 'Sur demande'
      : price === 0
        ? 'Gratuit'
        : `${price}€`;
  const period =
    price === null || price === undefined || price === 0 ? '' : '/mois';
  const yearlyNote =
    isYearly && price && price > 0 ? `Facturé ${plan.priceYearly}€/an` : null;

  const handleClick = async () => {
    if (plan.id === 'starter') {
      window.location.href = plan.ctaHref || '/register';
      return;
    }
    if (plan.id === 'enterprise') {
      window.location.href = plan.ctaHref || '/contact?type=enterprise';
      return;
    }
    setIsLoading(true);
    try {
      await onCheckout(plan.id);
    } catch (error: unknown) {
      logger.error('Erreur lors de la création de la session checkout', error);
      const err = error as { message?: string; error?: string };
      const errorMessage =
        err?.message || err?.error || 'Une erreur est survenue. Veuillez réessayer.';
      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('max requests')
      ) {
        toast({
          title: 'Trop de requêtes',
          description: 'Veuillez patienter quelques instants avant de réessayer.',
          variant: 'destructive',
        });
      } else if (
        errorMessage.includes('Configuration') ||
        errorMessage.includes('Stripe')
      ) {
        toast({
          title: 'Erreur de configuration',
          description: 'Veuillez contacter le support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 p-8 ${
        plan.popular
          ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-xl'
          : 'border-gray-200 bg-white'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
          {period && <span className="ml-2 text-lg text-gray-600">{period}</span>}
        </div>
        {yearlyNote && (
          <p className="mt-1 text-sm text-gray-500">{yearlyNote}</p>
        )}
        {isYearly &&
          price !== null &&
          price !== undefined &&
          price > 0 && (
            <p className="mt-1 text-sm font-medium text-green-600">
              Économisez 20% avec l&apos;abonnement annuel
            </p>
          )}
      </div>

      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full ${
          plan.popular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          plan.cta
        )}
      </Button>

      <ul className="mt-8 space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </motion>
  );
}
