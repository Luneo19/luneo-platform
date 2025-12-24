'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HoodiesTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 6 }), []);
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Templates Hoodies</h1>
          <p className="text-xl text-purple-100 mb-6">Templates 3D de hoodies personnalisables</p>
          <Link href="/register" className="bg-white/20 border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 inline-block">Créer un hoodie</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="h-48 bg-purple-900/30 rounded-lg mb-4 flex items-center justify-center">
                <Shirt className="w-20 h-20 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2 text-white">Hoodie {idx + 1}</h3>
              <Link href={`/demo/configurator?template=hoodie-${idx + 1}`} className="text-purple-400 font-semibold">Personnaliser →</Link>
            </div>
          ))}
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



