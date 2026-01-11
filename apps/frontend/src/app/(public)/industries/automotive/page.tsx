'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function AutomotiveIndustryPageContent() {
  const solutions = [
    { title: 'Vehicle Configurator', description: 'Configuration complète du véhicule', icon: <Car className="w-6 h-6" /> },
    { title: 'AR Showroom', description: 'Showroom en réalité augmentée', icon: <Car className="w-6 h-6" /> },
    { title: 'Virtual Test Drive', description: 'Essai virtuel immersif', icon: <Car className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Automotive"
        description="Configurateur véhicule 3D, AR showroom"
        badge="Industrie"
        gradient="from-blue-600 via-cyan-600 to-teal-600"
        cta={{
          label: 'Démo automotive',
          href: '/contact'
        }}
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Solutions Automotive"
            description="Tout ce dont vous avez besoin pour transformer votre showroom"
          />
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {solutions.map((solution, i) => (
              <FeatureCard
                key={i}
                title={solution.title}
                description={solution.description}
                icon={solution.icon}
                color="blue"
              />
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const AutomotiveIndustryPageMemo = memo(AutomotiveIndustryPageContent);

export default function AutomotiveIndustryPage() {
  return (
    <ErrorBoundary componentName="AutomotiveIndustryPage">
      <AutomotiveIndustryPageMemo />
    </ErrorBoundary>
  );
}



