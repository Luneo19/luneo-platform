'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function FashionIndustryPageContent() {
  const solutions = [
    { title: 'Virtual Try-On', description: 'Essayage virtuel avec AR', icon: <Sparkles className="w-6 h-6" /> },
    { title: '3D Configurator', description: 'Personnalisation vêtements 3D', icon: <Sparkles className="w-6 h-6" /> },
    { title: 'Lookbook AR', description: 'Collections en réalité augmentée', icon: <Sparkles className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Fashion & Apparel"
        description="Virtual try-on, 3D configurator, AR showcase pour la mode"
        badge="Industrie"
        gradient="from-purple-600 via-pink-600 to-rose-600"
        cta={{
          label: 'Parler à un expert mode',
          href: '/contact'
        }}
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Solutions pour la Mode"
            description="Tout ce dont vous avez besoin pour transformer votre business mode"
          />
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {solutions.map((solution, i) => (
              <FeatureCard
                key={i}
                title={solution.title}
                description={solution.description}
                icon={solution.icon}
                color="purple"
              />
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const FashionIndustryPageMemo = memo(FashionIndustryPageContent);

export default function FashionIndustryPage() {
  return (
    <ErrorBoundary componentName="FashionIndustryPage">
      <FashionIndustryPageMemo />
    </ErrorBoundary>
  );
}



