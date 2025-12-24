'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PrintOnDemandPageContent() {
  const features = useMemo(() => [
    'Intégration Printful / Printify / Teespring',
    'Export print-ready automatique (CMYK, DPI)',
    'Gestion produits multi-variantes',
    'Mockups 3D réalistes',
  ], []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Print-on-Demand</h1>
        <p className="text-xl text-gray-300 mb-8">Automatisez votre business POD avec Luneo</p>
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

const PrintOnDemandPageMemo = memo(PrintOnDemandPageContent);

export default function PrintOnDemandPage() {
  return (
    <ErrorBoundary componentName="PrintOnDemandPage">
      <PrintOnDemandPageMemo />
    </ErrorBoundary>
  );
}



