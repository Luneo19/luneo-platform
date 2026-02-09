'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Zap } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function SportsIndustryPageContent() {
  const solutions = [
    { title: 'Chaussures Custom', description: 'Nike By You style', icon: <Zap className="w-6 h-6" /> },
    { title: 'Maillots équipe', description: 'Design personnalisé', icon: <Zap className="w-6 h-6" /> },
    { title: 'Équipement', description: 'Raquettes, vélos, skis', icon: <Zap className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Sports & Outdoor"
        description="Personnalisation équipement sportif"
        badge="Industrie"
        gradient="from-green-600 via-emerald-600 to-teal-600"
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Solutions Sports"
              description="Tout ce dont vous avez besoin pour votre business sportif"
            />
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {solutions.map((solution, i) => (
                <FeatureCard
                  key={i}
                  title={solution.title}
                  description={solution.description}
                  icon={solution.icon}
                  color="green"
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

const SportsIndustryPageMemo = memo(SportsIndustryPageContent);

export default function SportsIndustryPage() {
  return (
    <ErrorBoundary componentName="SportsIndustryPage">
      <SportsIndustryPageMemo />
    </ErrorBoundary>
  );
}

