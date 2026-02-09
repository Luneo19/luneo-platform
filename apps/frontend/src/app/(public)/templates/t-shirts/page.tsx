'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TShirtsTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 9 }), []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Hero */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <Shirt className="w-16 h-16 mx-auto mb-6 text-purple-400" />
          <h1 className="text-5xl font-bold mb-4 text-white">Templates T-Shirts</h1>
          <p className="text-xl text-slate-300 mb-6">Plus de 500 templates t-shirts prêts à personnaliser</p>
          <Link href="/register" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 py-3 rounded-lg font-semibold inline-block">
            Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {templates.map((_, idx) => (
              <div key={idx} className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl shadow-lg overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                  <Shirt className="w-24 h-24 text-slate-400" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-white">T-Shirt Template {idx + 1}</h3>
                  <p className="text-slate-400 text-sm mb-4">Personnalisable, print-ready</p>
                  <Link href={`/demo/customizer?template=tshirt-${idx + 1}`} className="text-purple-400 hover:text-purple-300 font-semibold">
                    Personnaliser →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const TShirtsTemplatesPageMemo = memo(TShirtsTemplatesPageContent);

export default function TShirtsTemplatesPage() {
  return (
    <ErrorBoundary componentName="TShirtsTemplatesPage">
      <TShirtsTemplatesPageMemo />
    </ErrorBoundary>
  );
}



