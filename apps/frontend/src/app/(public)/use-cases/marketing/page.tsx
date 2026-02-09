'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Megaphone, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function MarketingUseCasePageContent() {
  const features = useMemo(() => [
    'Génération visuels IA en masse',
    'A/B testing automatisé',
    'Publications multi-plateformes',
    'Templates brandés réutilisables',
    'Analytics intégrés',
    'Calendrier éditorial',
    'Collaboration équipe',
    'Export tous formats (PNG, PDF, SVG)',
  ], []);

  return (
    <>
      <PageHero
        title="Marketing & Automation"
        description="Automatisez la création de visuels marketing avec IA. Gagnez 10h/semaine."
        badge="Cas d'usage"
        gradient="from-pink-600 via-rose-600 to-purple-600"
        cta={{
          label: 'Réserver une démo',
          href: '/contact'
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Pour les Équipes Marketing"
              description="Tout ce dont vous avez besoin pour automatiser votre marketing"
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

const MarketingUseCasePageMemo = memo(MarketingUseCasePageContent);

export default function MarketingUseCasePage() {
  return (
    <ErrorBoundary componentName="MarketingUseCasePage">
      <MarketingUseCasePageMemo />
    </ErrorBoundary>
  );
}



