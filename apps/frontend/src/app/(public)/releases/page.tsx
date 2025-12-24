'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';

function ReleasesPageContent() {
  const releases = [
    {
      version: '2.5.0',
      date: '6 Novembre 2025',
      type: 'major',
      features: [
        'Bulk Generation AI - 1000 designs/heure',
        'Virtual Try-On - Face tracking 468 points',
        '9 nouveaux templates système',
        'Performance 3D +40%',
      ],
    },
    {
      version: '2.4.1',
      date: '3 Novembre 2025',
      type: 'patch',
      features: [
        'Hotfix: Bug pricing Stripe',
        'Fix: OAuth GitHub flow',
        'Performance: Optimisation assets',
      ],
    },
    {
      version: '2.4.0',
      date: '1 Novembre 2025',
      type: 'minor',
      features: [
        'Export AR - USDZ + GLB',
        'Python SDK v1.0',
        'Optimisation 3D automatique',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-white mb-4">
          Releases
        </h1>
        <p className="text-center text-xl text-gray-300 mb-16">
          Toutes les versions de Luneo
        </p>

        <div className="space-y-8">
          {releases.map((release) => (
            <div key={release.version} className="bg-gray-800/50 rounded-xl shadow-lg p-8 border-l-4 border-purple-500 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    v{release.version}
                  </h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    release.type === 'major' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30' :
                    release.type === 'minor' ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' :
                    'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}>
                    {release.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  {release.date}
                </div>
              </div>

              <ul className="space-y-2">
                {release.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-300">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/changelog" className="text-purple-400 hover:text-purple-300 font-medium">
            Voir le changelog complet →
          </Link>
        </div>
      </div>
    </div>
  );
}

const ReleasesPageMemo = memo(ReleasesPageContent);

export default function ReleasesPage() {
  return (
    <ErrorBoundary componentName="ReleasesPage">
      <ReleasesPageMemo />
    </ErrorBoundary>
  );
}
