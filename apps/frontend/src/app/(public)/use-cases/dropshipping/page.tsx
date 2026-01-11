'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Check } from 'lucide-react';

function DropshippingPageContent() {
  const features = useMemo(() => [
    'Catalogues produits automatisés',
    'Personnalisation à la commande',
    'Sync AliExpress / CJDropshipping',
    'Mockups produits IA',
  ], []);

  return (
    <>
      <PageHero
        title="Dropshipping"
        description="Personnalisation produits pour dropshipping. Intégration avec AliExpress et CJDropshipping."
        badge="Cas d'usage"
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Fonctionnalités Dropshipping"
            description="Tout ce dont vous avez besoin pour votre business dropshipping"
          />
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const DropshippingPageMemo = memo(DropshippingPageContent);

export default function DropshippingPage() {
  return (
    <ErrorBoundary componentName="DropshippingPage">
      <DropshippingPageMemo />
    </ErrorBoundary>
  );
}



