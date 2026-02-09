'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PostersPageContent() {
  const templates = useMemo(() => Array.from({ length: 8 }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Hero */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">Posters Templates</h1>
          <p className="text-xl text-slate-300 mb-6">Plus de 400 templates posters personnalisables</p>
          <Link href="/register" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 py-3 rounded-lg font-semibold inline-block">Créer un poster</Link>
        </div>
      </section>
      {/* Templates Grid */}
      <section className="dark-section relative noise-overlay py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {templates.map((_, idx) => (
              <div key={idx} className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl p-6">
                <div className="h-64 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg mb-4"></div>
                <h3 className="font-bold text-white mb-2">Poster {idx + 1}</h3>
                <Link href={`/demo/customizer?template=poster-${idx + 1}`} className="text-blue-400 hover:text-blue-300 font-semibold">Personnaliser →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const PostersPageMemo = memo(PostersPageContent);

export default function PostersPage() {
  return (
    <ErrorBoundary componentName="PostersPage">
      <PostersPageMemo />
    </ErrorBoundary>
  );
}



