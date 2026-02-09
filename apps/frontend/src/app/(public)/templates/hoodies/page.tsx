'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HoodiesTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 6 }), []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Hero */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">Templates Hoodies</h1>
          <p className="text-xl text-slate-300 mb-6">Templates 3D de hoodies personnalisables</p>
          <Link href="/register" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 py-3 rounded-lg font-semibold inline-block">Créer un hoodie</Link>
        </div>
      </section>
      {/* Templates Grid */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {templates.map((_, idx) => (
              <div key={idx} className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl shadow-lg p-6">
                <div className="h-48 bg-purple-900/20 rounded-lg mb-4 flex items-center justify-center">
                  <Shirt className="w-20 h-20 text-purple-400" />
                </div>
                <h3 className="font-bold mb-2 text-white">Hoodie {idx + 1}</h3>
                <Link href={`/demo/configurator?template=hoodie-${idx + 1}`} className="text-purple-400 hover:text-purple-300 font-semibold">Personnaliser →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const HoodiesTemplatesPageMemo = memo(HoodiesTemplatesPageContent);

export default function HoodiesTemplatesPage() {
  return (
    <ErrorBoundary componentName="HoodiesTemplatesPage">
      <HoodiesTemplatesPageMemo />
    </ErrorBoundary>
  );
}



