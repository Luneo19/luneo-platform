'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { FileText } from 'lucide-react';

function ReleaseNotesPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Release Notes</h1>
          <p className="text-xl text-purple-100">Historique détaillé des versions</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-white">v2.5.0 - Novembre 2025</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✨ Nouveau configurateur 3D avec PBR materials avancés</li>
            <li>✨ Support complet USDZ pour iOS AR</li>
            <li>✨ Bulk generation avec BullMQ - 1000+ designs/h</li>
            <li>⚡ Performance 3D viewer +40% plus rapide</li>
            <li>🐛 Correction bug export GLB avec textures</li>
          </ul>
        </div>
        <div className="mt-6 text-center">
          <Link href="/changelog" className="text-blue-400 hover:text-blue-300 font-semibold">Voir le changelog complet →</Link>
        </div>
      </section>
    </div>
  );
}

const ReleaseNotesPageMemo = memo(ReleaseNotesPageContent);

export default function ReleaseNotesPage() {
  return (
    <ErrorBoundary componentName="ReleaseNotesPage">
      <ReleaseNotesPageMemo />
    </ErrorBoundary>
  );
}



