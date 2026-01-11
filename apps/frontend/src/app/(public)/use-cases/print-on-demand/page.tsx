'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Check } from 'lucide-react';

function PrintOnDemandPageContent() {
  const features = useMemo(() => [
    'Intégration Printful / Printify / Teespring',
    'Export print-ready automatique (CMYK, DPI)',
    'Gestion produits multi-variantes',
    'Mockups 3D réalistes',
  ], []);

  return (
    <>
      <PageHero
        title="Print-on-Demand"
        description="Automatisez votre business POD avec Luneo. Intégration native avec Printful, Printify et Teespring."
        badge="Cas d'usage"
        gradient="from-teal-600 via-cyan-600 to-blue-600"
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Fonctionnalités Print-on-Demand"
            description="Tout ce dont vous avez besoin pour automatiser votre POD"
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

const PrintOnDemandPageMemo = memo(PrintOnDemandPageContent);

export default function PrintOnDemandPage() {
  return (
    <ErrorBoundary componentName="PrintOnDemandPage">
      <PrintOnDemandPageMemo />
    </ErrorBoundary>
  );
}



