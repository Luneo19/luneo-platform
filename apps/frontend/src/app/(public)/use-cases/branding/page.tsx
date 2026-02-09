'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Palette, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

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

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Design System Complet"
              description="Tout ce dont vous avez besoin pour maintenir votre identité de marque"
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

const BrandingUseCasePageMemo = memo(BrandingUseCasePageContent);

export default function BrandingUseCasePage() {
  return (
    <ErrorBoundary componentName="BrandingUseCasePage">
      <BrandingUseCasePageMemo />
    </ErrorBoundary>
  );
}



