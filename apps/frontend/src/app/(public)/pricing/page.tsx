'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FEATURES, FAQS } from './data';
import { PricingHero } from './components/PricingHero';
import { PricingPlanCard } from './components/PricingPlanCard';
import { PricingFeatureTable } from './components/PricingFeatureTable';
import { PricingFAQ } from './components/PricingFAQ';
import { PricingCTA } from './components/PricingCTA';
import { usePricingPage } from './hooks/usePricingPage';

function PricingPageContent() {
  const { mergedPlans, isYearly, setIsYearly, handleCheckout } = usePricingPage();

  return (
    <div className="min-h-screen bg-white">
      <PricingHero isYearly={isYearly} onYearlyChange={setIsYearly} />
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {mergedPlans.map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} isYearly={isYearly} onCheckout={handleCheckout} />
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <PricingFeatureTable features={FEATURES} />
          </div>
        </div>
      </section>
      <section className="border-t border-gray-200 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <PricingFAQ items={FAQS} />
        </div>
      </section>
      <PricingCTA />
    </div>
  );
}

export default function PricingPage() {
  return <ErrorBoundary level="page" componentName="PricingPage"><PricingPageContent /></ErrorBoundary>;
}
