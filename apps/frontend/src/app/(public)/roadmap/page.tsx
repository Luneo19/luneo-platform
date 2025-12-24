'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Map, Check, Clock, Circle } from 'lucide-react';

const roadmapItems = [
  { title: 'AI Video Generation', status: 'planned', quarter: 'Q1 2026', desc: 'Génération vidéos produits avec IA' },
  { title: 'Mobile SDK (React Native)', status: 'in-progress', quarter: 'Q4 2025', desc: 'SDK natif iOS/Android' },
  { title: 'Advanced Analytics Dashboard', status: 'completed', quarter: 'Q3 2025', desc: 'Analytics avancés' },
  { title: 'White-label Platform', status: 'planned', quarter: 'Q2 2026', desc: 'Plateforme complète white-label' },
];

function RoadmapPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Map className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Product Roadmap</h1>
          <p className="text-xl text-purple-100">Découvrez les prochaines fonctionnalités</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="space-y-6">
          {roadmapItems.map((item, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg p-6 flex items-start gap-4 border border-gray-700">
              <div className="flex-shrink-0">
                {item.status === 'completed' && <Check className="w-8 h-8 text-green-400" />}
                {item.status === 'in-progress' && <Clock className="w-8 h-8 text-blue-400 animate-pulse" />}
                {item.status === 'planned' && <Circle className="w-8 h-8 text-gray-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <span className="text-sm font-semibold text-gray-400">{item.quarter}</span>
                </div>
                <p className="text-gray-300">{item.desc}</p>
                {item.status === 'completed' && (
                  <span className="inline-block mt-2 bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                    ✓ Terminé
                  </span>
                )}
                {item.status === 'in-progress' && (
                  <span className="inline-block mt-2 bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
                    🚧 En cours
                  </span>
                )}
                {item.status === 'planned' && (
                  <span className="inline-block mt-2 bg-gray-500/20 text-gray-400 text-xs font-semibold px-3 py-1 rounded-full border border-gray-500/30">
                    📋 Planifié
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Une idée de fonctionnalité ?</h2>
          <p className="text-purple-100 mb-6">Proposez vos idées et votez pour les features</p>
          <Link href="/contact?subject=feature-request" className="bg-white/20 border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 inline-block">
            Proposer une feature
          </Link>
        </div>
      </section>
    </div>
  );
}

const RoadmapPageMemo = memo(RoadmapPageContent);

export default function RoadmapPage() {
  return (
    <ErrorBoundary componentName="RoadmapPage">
      <RoadmapPageMemo />
    </ErrorBoundary>
  );
}
