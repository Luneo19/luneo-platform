'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DropshippingPageContent() {
  const features = useMemo(() => [
    'Catalogues produits automatisés',
    'Personnalisation à la commande',
    'Sync AliExpress / CJDropshipping',
    'Mockups produits IA',
  ], []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Dropshipping</h1>
        <p className="text-xl text-gray-300 mb-8">Personnalisation produits pour dropshipping</p>
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

const DropshippingPageMemo = memo(DropshippingPageContent);

export default function DropshippingPage() {
  return (
    <ErrorBoundary componentName="DropshippingPage">
      <DropshippingPageMemo />
    </ErrorBoundary>
  );
}



