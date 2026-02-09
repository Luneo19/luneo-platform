'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function BusinessCardsPageContent() {
  const templates = useMemo(() => Array.from({ length: 9 }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Hero */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">Business Cards Templates</h1>
          <p className="text-xl text-slate-300 mb-6">100+ templates cartes de visite professionnelles</p>
          <Link href="/register" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 py-3 rounded-lg font-semibold inline-block">Créer une carte</Link>
        </div>
      </section>
      {/* Templates Grid */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {templates.map((_, idx) => (
              <div key={idx} className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl shadow-lg p-6">
                <div className="aspect-[1.75] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-600 rounded-full mx-auto mb-2"></div>
                    <div className="h-2 w-24 bg-slate-600 rounded mx-auto"></div>
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-white">Business Card {idx + 1}</h3>
                <Link href={`/demo/customizer?template=card-${idx + 1}`} className="text-blue-400 hover:text-blue-300 font-semibold">Personnaliser →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
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



