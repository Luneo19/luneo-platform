'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Megaphone, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Megaphone className="w-16 h-16 mb-6 text-white" />
          <h1 className="text-5xl font-bold mb-6 text-white">Marketing & Automation</h1>
          <p className="text-2xl text-pink-100 mb-8">
            Automatisez la création de visuels marketing avec IA. Gagnez 10h/semaine.
          </p>
          <Link href="/contact" className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 inline-block">
            Réserver une démo
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Pour les Équipes Marketing</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
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



