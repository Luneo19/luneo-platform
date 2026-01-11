'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { Check } from 'lucide-react';

function AgencyPageContent() {
  const features = useMemo(() => [
    'White-label complet',
    'Multi-clients management',
    'Collaboration équipe',
    'Commission sur ventes clients',
  ], []);

  return (
    <>
      <PageHero
        title="Agencies & Studios"
        description="White-label solution pour agences créatives. Gérez plusieurs clients avec une seule plateforme."
        badge="Cas d'usage"
        gradient="from-purple-600 via-pink-600 to-rose-600"
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Pour les Agences Créatives"
            description="Tout ce dont vous avez besoin pour gérer vos clients"
          />
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

const AgencyPageMemo = memo(AgencyPageContent);

export default function AgencyPage() {
  return (
    <ErrorBoundary componentName="AgencyPage">
      <AgencyPageMemo />
    </ErrorBoundary>
  );
}



