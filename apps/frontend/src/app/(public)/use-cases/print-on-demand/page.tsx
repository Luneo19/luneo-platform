'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Check } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

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

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Fonctionnalités Print-on-Demand"
              description="Tout ce dont vous avez besoin pour automatiser votre POD"
            />
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {features.map((feature) => (
                <ScrollReveal key={feature}>
                  <div className="flex items-start gap-3 bg-dark-card/60 backdrop-blur-sm p-4 rounded-lg border border-white/[0.04]">
                    <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
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



