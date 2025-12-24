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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Agencies & Studios</h1>
        <p className="text-xl text-gray-300 mb-8">White-label solution pour agences créatives</p>
        <ul className="space-y-3 text-gray-300">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
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



