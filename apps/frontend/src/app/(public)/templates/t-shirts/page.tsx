'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TShirtsTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 9 }), []);
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Shirt className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Templates T-Shirts</h1>
          <p className="text-xl text-blue-100 mb-6">Plus de 500 templates t-shirts prêts à personnaliser</p>
          <Link href="/register" className="bg-white/20 border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 inline-block">
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg overflow-hidden border border-gray-700">
              <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <Shirt className="w-24 h-24 text-gray-400" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 text-white">T-Shirt Template {idx + 1}</h3>
                <p className="text-gray-300 text-sm mb-4">Personnalisable, print-ready</p>
                <Link href={`/demo/customizer?template=tshirt-${idx + 1}`} className="text-blue-400 hover:text-blue-300 font-semibold">
                  Personnaliser →
                </Link>
              </div>
            </div>
          ))}
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



