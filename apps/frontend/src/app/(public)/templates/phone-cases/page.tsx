'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PhoneCasesTemplatesPageContent() {
  const templates = useMemo(() => Array.from({ length: 8 }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Smartphone className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Coques Téléphone</h1>
          <p className="text-xl text-teal-100 mb-6">Designs 3D pour iPhone, Samsung, etc.</p>
          <Link href="/register" className="bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 inline-block">Créer une coque</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-48 bg-teal-50 rounded-lg mb-4 flex items-center justify-center">
                <Smartphone className="w-16 h-16 text-teal-400" />
              </div>
              <h3 className="font-bold mb-2">Coque {idx + 1}</h3>
              <Link href={`/demo/configurator?template=phone-${idx + 1}`} className="text-teal-600 font-semibold">Personnaliser →</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const PhoneCasesTemplatesPageMemo = memo(PhoneCasesTemplatesPageContent);

export default function PhoneCasesTemplatesPage() {
  return (
    <ErrorBoundary componentName="PhoneCasesTemplatesPage">
      <PhoneCasesTemplatesPageMemo />
    </ErrorBoundary>
  );
}



