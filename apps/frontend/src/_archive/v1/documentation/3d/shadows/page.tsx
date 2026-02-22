'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Shadows3DPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">
              Ombres 3D
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Gérez l'éclairage et les ombres de vos scènes 3D
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Shadow Mapping</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Types d'ombres</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>PCF (Percentage Closer Filtering)</li>
            <li>PCF Soft Shadows</li>
            <li>VSM (Variance Shadow Maps)</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Optimisation</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Réduisez la résolution des shadow maps (1024×1024 suffit souvent)</li>
            <li>Limitez le nombre de lumières qui castent des ombres</li>
            <li>Utilisez des shadow cascades pour les grandes scènes</li>
            <li>Activez le frustum culling pour les ombres</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const Shadows3DPageMemo = memo(Shadows3DPageContent);

export default function Shadows3DPage() {
  return (
    <ErrorBoundary componentName="Shadows3DPage">
      <Shadows3DPageMemo />
    </ErrorBoundary>
  );
}
