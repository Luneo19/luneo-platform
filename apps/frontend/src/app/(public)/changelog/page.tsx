'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Bug, Zap, Plus } from 'lucide-react';

const releases = [
  {
    version: '2.5.0',
    date: '2025-11-06',
    type: 'major',
    changes: [
      { type: 'feature', text: 'Nouveau configurateur 3D avec PBR materials avancés' },
      { type: 'feature', text: 'Support complet USDZ pour iOS AR' },
      { type: 'feature', text: 'Bulk generation avec BullMQ - 1000+ designs/h' },
      { type: 'improvement', text: 'Performance 3D viewer +40% plus rapide' },
      { type: 'fix', text: 'Correction bug export GLB avec textures' },
    ],
  },
  {
    version: '2.4.0',
    date: '2025-10-28',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'Intégration DALL-E 3 pour génération IA' },
      { type: 'feature', text: 'Virtual Try-On avec MediaPipe face tracking' },
      { type: 'improvement', text: 'Nouveau dashboard analytics' },
      { type: 'fix', text: 'Correction problèmes OAuth Google' },
    ],
  },
  {
    version: '2.3.0',
    date: '2025-10-15',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'SDK React avec composants ready-to-use' },
      { type: 'feature', text: 'CLI Luneo pour automatisation CI/CD' },
      { type: 'improvement', text: 'Documentation complète refaite' },
      { type: 'improvement', text: 'API rate limiting optimisé' },
    ],
  },
  {
    version: '2.2.0',
    date: '2025-10-01',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'Intégration Shopify native' },
      { type: 'feature', text: 'Webhooks pour événements temps réel' },
      { type: 'improvement', text: 'Optimisation assets 3D automatique' },
      { type: 'fix', text: 'Correction exports print-ready CMYK' },
    ],
  },
  {
    version: '2.1.0',
    date: '2025-09-20',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'Visual Customizer Konva.js avec layers' },
      { type: 'feature', text: 'Export multi-format (PNG/SVG/PDF)' },
      { type: 'improvement', text: 'UI/UX redesign complet' },
    ],
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return <Plus className="w-4 h-4 text-green-600" />;
    case 'improvement':
      return <Zap className="w-4 h-4 text-blue-600" />;
    case 'fix':
      return <Bug className="w-4 h-4 text-red-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-purple-600" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'feature':
      return 'Nouvelle fonctionnalité';
    case 'improvement':
      return 'Amélioration';
    case 'fix':
      return 'Correction';
    default:
      return 'Changement';
  }
};

function ChangelogPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full mb-4 border border-blue-500/30">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Changelog</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Quoi de Neuf ?
          </h1>
          <p className="text-xl text-gray-300">
            Suivez toutes les nouvelles fonctionnalités et améliorations de Luneo
          </p>
        </div>

        {/* Subscribe */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Restez à jour</h2>
              <p className="text-blue-100">Recevez les nouveautés par email</p>
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="votre@email.com"
                className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                S'abonner
              </button>
            </div>
          </div>
        </div>

        {/* Releases */}
        <div className="space-y-8">
          {releases.map((release, idx) => (
            <div key={release.version} className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
              {/* Release Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">
                      v{release.version}
                    </h2>
                    {idx === 0 && (
                      <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                        Dernière version
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">
                    {new Date(release.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Changes */}
              <ul className="space-y-3">
                {release.changes.map((change, changeIdx) => (
                  <li key={changeIdx} className="flex items-start gap-3">
                    <div className="mt-1">
                      {getTypeIcon(change.type)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        {getTypeLabel(change.type)}
                      </span>
                      <p className="text-gray-300">{change.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Archive Link */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Voir l'historique complet sur{' '}
            <a href="https://github.com/luneo/releases" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold underline">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const ChangelogPageMemo = memo(ChangelogPageContent);

export default function ChangelogPage() {
  return (
    <ErrorBoundary level="page" componentName="ChangelogPage">
      <ChangelogPageMemo />
    </ErrorBoundary>
  );
}
