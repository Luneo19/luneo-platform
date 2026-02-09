'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Gem } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function JewelryIndustryPageContent() {
  const solutions = [
    { title: 'PBR Materials', description: 'Rendu photoréaliste', icon: <Gem className="w-6 h-6" /> },
    { title: 'Virtual Try-On', description: 'Essayage AR bijoux', icon: <Gem className="w-6 h-6" /> },
    { title: 'Configurator', description: 'Personnalisation pierres, métaux', icon: <Gem className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Jewelry & Luxury"
        description="Visualisation 3D ultra-réaliste pour bijoux"
        badge="Industrie"
        gradient="from-yellow-600 via-amber-600 to-orange-600"
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
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
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const JewelryIndustryPageMemo = memo(JewelryIndustryPageContent);

export default function JewelryIndustryPage() {
  return (
    <ErrorBoundary componentName="JewelryIndustryPage">
      <JewelryIndustryPageMemo />
    </ErrorBoundary>
  );
}

