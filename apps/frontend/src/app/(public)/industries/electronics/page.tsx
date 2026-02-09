'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Cpu } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function ElectronicsIndustryPageContent() {
  const solutions = [
    { title: 'PC Builder', description: 'Configurateur PC gaming', icon: <Cpu className="w-6 h-6" /> },
    { title: 'Smartphones', description: 'Personnalisation coques', icon: <Cpu className="w-6 h-6" /> },
    { title: 'AR Placement', description: 'TV, sound systems', icon: <Cpu className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Electronics"
        description="Configuration tech products en 3D"
        badge="Industrie"
        gradient="from-indigo-600 via-blue-600 to-cyan-600"
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Solutions Electronics"
              description="Tout ce dont vous avez besoin pour vos produits tech"
            />
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {solutions.map((solution, i) => (
                <FeatureCard
                  key={i}
                  title={solution.title}
                  description={solution.description}
                  icon={solution.icon}
                  color="indigo"
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

const ElectronicsIndustryPageMemo = memo(ElectronicsIndustryPageContent);

export default function ElectronicsIndustryPage() {
  return (
    <ErrorBoundary componentName="ElectronicsIndustryPage">
      <ElectronicsIndustryPageMemo />
    </ErrorBoundary>
  );
}

