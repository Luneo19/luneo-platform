'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Gem } from 'lucide-react';

function JewelleryIndustryPageContent() {
  const solutions = [
    { title: 'PBR Materials', description: 'Rendu photoréaliste', icon: <Gem className="w-6 h-6" /> },
    { title: 'Virtual Try-On', description: 'Essayage AR bijoux', icon: <Gem className="w-6 h-6" /> },
    { title: 'Configurator', description: 'Personnalisation pierres, métaux', icon: <Gem className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Jewellery & Luxury"
        description="Visualisation 3D ultra-réaliste pour bijoux"
        badge="Industrie"
        gradient="from-yellow-600 via-amber-600 to-orange-600"
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Solutions Bijouterie"
            description="Tout ce dont vous avez besoin pour votre business bijoux"
          />
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {solutions.map((solution, i) => (
              <FeatureCard
                key={i}
                title={solution.title}
                description={solution.description}
                icon={solution.icon}
                color="orange"
              />
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const JewelleryIndustryPageMemo = memo(JewelleryIndustryPageContent);

export default function JewelleryIndustryPage() {
  return (
    <ErrorBoundary componentName="JewelleryIndustryPage">
      <JewelleryIndustryPageMemo />
    </ErrorBoundary>
  );
}
