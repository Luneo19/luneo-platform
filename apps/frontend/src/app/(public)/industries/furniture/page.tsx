'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Armchair } from 'lucide-react';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function FurnitureIndustryPageContent() {
  const solutions = [
    { title: 'AR Placement', description: 'Visualisation dans votre intérieur', icon: <Armchair className="w-6 h-6" /> },
    { title: 'Material Configurator', description: 'Choix tissus, couleurs, finitions', icon: <Armchair className="w-6 h-6" /> },
    { title: 'Room Planner', description: 'Aménagement 3D complet', icon: <Armchair className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Furniture & Home Decor"
        description="AR placement, 3D configurator pour mobilier"
        badge="Industrie"
        gradient="from-amber-600 via-orange-600 to-red-600"
        cta={{
          label: 'Démo furniture',
          href: '/contact'
        }}
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Solutions Mobilier"
            description="Tout ce dont vous avez besoin pour transformer votre showroom mobilier"
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

const FurnitureIndustryPageMemo = memo(FurnitureIndustryPageContent);

export default function FurnitureIndustryPage() {
  return (
    <ErrorBoundary componentName="FurnitureIndustryPage">
      <FurnitureIndustryPageMemo />
    </ErrorBoundary>
  );
}



