'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AgencyPageContent() {
  const features = useMemo(() => [
    'White-label complet',
    'Multi-clients management',
    'Collaboration équipe',
    'Commission sur ventes clients',
  ], []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">Agencies & Studios</h1>
      <p className="text-xl text-gray-600 mb-8">White-label solution pour agences créatives</p>
      <ul className="space-y-3 text-gray-700">
        {features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
    </div>
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



