'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function BusinessCardsPageContent() {
  const templates = useMemo(() => Array.from({ length: 9 }), []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">Business Cards Templates</h1>
      <p className="text-xl text-gray-600 mb-8">100+ templates cartes de visite professionnelles</p>
      <div className="grid md:grid-cols-3 gap-8">
        {templates.map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
            <div className="aspect-[1.75] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                <div className="h-2 w-24 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
            <h3 className="font-bold mb-2">Business Card {idx + 1}</h3>
            <Link href={`/demo/customizer?template=card-${idx + 1}`} className="text-blue-600 hover:text-blue-700 font-semibold">Personnaliser →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const BusinessCardsPageMemo = memo(BusinessCardsPageContent);

export default function BusinessCardsPage() {
  return (
    <ErrorBoundary componentName="BusinessCardsPage">
      <BusinessCardsPageMemo />
    </ErrorBoundary>
  );
}



