'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HoodiesTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 6 }), []);
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Templates Hoodies</h1>
          <p className="text-xl text-purple-100 mb-6">Templates 3D de hoodies personnalisables</p>
          <Link href="/register" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 inline-block">Créer un hoodie</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-48 bg-purple-50 rounded-lg mb-4 flex items-center justify-center">
                <Shirt className="w-20 h-20 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Hoodie {idx + 1}</h3>
              <Link href={`/demo/configurator?template=hoodie-${idx + 1}`} className="text-purple-600 font-semibold">Personnaliser →</Link>
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



