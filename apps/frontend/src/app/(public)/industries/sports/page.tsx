'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Zap } from 'lucide-react';

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

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
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

