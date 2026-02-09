'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StickersPageContent() {
  const templates = useMemo(() => Array.from({ length: 10 }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Hero */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">Stickers Templates</h1>
          <p className="text-xl text-slate-300 mb-6">250+ templates stickers personnalisables</p>
          <Link href="/register" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 py-3 rounded-lg font-semibold inline-block">Créer un sticker</Link>
        </div>
      </section>
      {/* Templates Grid */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-6">
            {templates.map((_, idx) => (
              <div key={idx} className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-full mx-auto mb-4"></div>
                <h3 className="font-bold mb-2 text-white">Sticker {idx + 1}</h3>
                <Link href={`/demo/customizer?template=sticker-${idx + 1}`} className="text-purple-400 hover:text-purple-300 font-semibold text-sm">Personnaliser →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const StickersPageMemo = memo(StickersPageContent);

export default function StickersPage() {
  return (
    <ErrorBoundary componentName="StickersPage">
      <StickersPageMemo />
    </ErrorBoundary>
  );
}



