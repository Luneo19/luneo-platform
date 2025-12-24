'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Award } from 'lucide-react';

function CaseStudiesPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Award className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Case Studies</h1>
          <p className="text-xl text-indigo-100">Découvrez comment nos clients utilisent Luneo</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { company: 'Fashion Brand X', result: '+45% conversion avec AR try-on' },
            { company: 'Print Company Y', result: 'Automatisation 90% designs' },
            { company: 'E-commerce Z', result: '1M produits personnalisés/mois' },
            { company: 'Agency A', result: 'Réduction 80% temps production' },
          ].map((cs, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
              <h3 className="font-bold text-2xl mb-2 text-white">{cs.company}</h3>
              <p className="text-gray-300 mb-4">{cs.result}</p>
              <Link href={`/case-studies/${idx + 1}`} className="text-blue-400 hover:text-blue-300 font-semibold">Lire le cas →</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const CaseStudiesPageMemo = memo(CaseStudiesPageContent);

export default function CaseStudiesPage() {
  return (
    <ErrorBoundary componentName="CaseStudiesPage">
      <CaseStudiesPageMemo />
    </ErrorBoundary>
  );
}
