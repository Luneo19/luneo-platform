'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Megaphone, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

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

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Pour les Équipes Marketing"
            description="Tout ce dont vous avez besoin pour automatiser votre marketing"
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

const MarketingUseCasePageMemo = memo(MarketingUseCasePageContent);

export default function MarketingUseCasePage() {
  return (
    <ErrorBoundary componentName="MarketingUseCasePage">
      <MarketingUseCasePageMemo />
    </ErrorBoundary>
  );
}



