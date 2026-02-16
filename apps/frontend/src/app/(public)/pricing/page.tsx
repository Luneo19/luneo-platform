'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PricingHero } from './components/PricingHero';
import { PricingPlanCard } from './components/PricingPlanCard';
import { PricingFeatureTable } from './components/PricingFeatureTable';
import { PricingFAQ } from './components/PricingFAQ';
import { PricingCTA } from './components/PricingCTA';
import { PricingCommissionInfo } from './components/PricingCommissionInfo';
import { usePricingPage } from './hooks/usePricingPage';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function PricingPageContent() {
  const { mergedPlans, isYearly, setIsYearly, handleCheckout, translatedFeatures, translatedFaqs, t } = usePricingPage();

  return (
    <div className="min-h-screen">
      <PricingHero isYearly={isYearly} onYearlyChange={setIsYearly} />
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top row: first 3 plans (Free, Starter, Professional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-4 sm:mb-5 lg:mb-6">
            {mergedPlans.slice(0, 3).map((plan, index) => (
              <ScrollReveal key={plan.id} animation="fade-up" staggerIndex={index} staggerDelay={80} delay={50}>
                <PricingPlanCard plan={plan} isYearly={isYearly} onCheckout={handleCheckout} />
              </ScrollReveal>
            ))}
          </div>
          {/* Bottom row: last 2 plans (Business, Enterprise) centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 lg:w-2/3 mx-auto">
            {mergedPlans.slice(3).map((plan, index) => (
              <ScrollReveal key={plan.id} animation="fade-up" staggerIndex={index + 3} staggerDelay={80} delay={50}>
                <PricingPlanCard plan={plan} isYearly={isYearly} onCheckout={handleCheckout} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-white/[0.04] py-12 sm:py-16 md:py-24">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-xl sm:rounded-2xl bg-dark-card border border-white/[0.04]">
              <PricingFeatureTable features={translatedFeatures} />
            </div>
          </div>
        </ScrollReveal>
      </section>
      <section className="border-t border-white/[0.04] py-12 sm:py-16 md:py-24">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PricingCommissionInfo />
          </div>
        </ScrollReveal>
      </section>
      <section className="border-t border-white/[0.04] py-12 sm:py-16 md:py-24">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <PricingFAQ items={translatedFaqs} title={t('pricing.faq.title')} />
          </div>
        </ScrollReveal>
      </section>
      <PricingCTA />
    </div>
  );
}

export default function PricingPage() {
  return <ErrorBoundary level="page" componentName="PricingPage"><PricingPageContent /></ErrorBoundary>;
}
