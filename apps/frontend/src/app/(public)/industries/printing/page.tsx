'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Printer } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function PrintingIndustryPageContent() {
  const solutions = [
    { title: 'Print-Ready Export', description: 'Export CMYK automatique', icon: <Printer className="w-6 h-6" /> },
    { title: 'Bleed Zones', description: 'Gestion automatique des marges', icon: <Printer className="w-6 h-6" /> },
    { title: 'High DPI', description: 'Export 300 DPI minimum', icon: <Printer className="w-6 h-6" /> },
  ];

  return (
    <>
      <PageHero
        title="Printing & Print-on-Demand"
        description="Automatisez votre workflow print avec des fichiers prêts à imprimer"
        badge="Industrie"
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Solutions Printing"
              description="Tout ce dont vous avez besoin pour votre business print"
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
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const PrintingIndustryPageMemo = memo(PrintingIndustryPageContent);

export default function PrintingIndustryPage() {
  return (
    <ErrorBoundary componentName="PrintingIndustryPage">
      <PrintingIndustryPageMemo />
    </ErrorBoundary>
  );
}
