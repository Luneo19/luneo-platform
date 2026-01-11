'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Palette, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function BrandingUseCasePageContent() {
  const features = useMemo(() => [
    'Brand colors & typography',
    'Logo variants & guidelines',
    'Templates brandés réutilisables',
    'Asset library centralisée',
    'Version control designs',
    'Export guidelines automatique',
    'Collaboration équipe créa',
    'White-label pour agences',
  ], []);

  return (
    <>
      <PageHero
        title="Branding & Design System"
        description="Créez et maintenez votre design system cohérent sur tous les supports."
        badge="Cas d'usage"
        gradient="from-amber-600 via-orange-600 to-red-600"
        cta={{
          label: 'Parler à un expert',
          href: '/contact'
        }}
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Design System Complet"
            description="Tout ce dont vous avez besoin pour maintenir votre identité de marque"
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

const BrandingUseCasePageMemo = memo(BrandingUseCasePageContent);

export default function BrandingUseCasePage() {
  return (
    <ErrorBoundary componentName="BrandingUseCasePage">
      <BrandingUseCasePageMemo />
    </ErrorBoundary>
  );
}



