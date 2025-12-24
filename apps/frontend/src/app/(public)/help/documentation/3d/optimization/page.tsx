'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Optimization3DPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h1 className="text-4xl font-bold text-white mb-4">
            Optimisation 3D
          </h1>
          <p className="text-gray-300 text-lg">
            Optimisez vos modèles pour des performances maximales
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Réduction de mesh</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { optimizeMesh } from '@luneo/3d-tools';

const optimized = await optimizeMesh({
  model: '/model.glb',
  targetTriangles: 50000,
  preserveUVs: true,
  preserveNormals: true
});`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Compression de textures</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// Automatic texture compression
const compressed = await compressTextures({
  model: '/model.glb',
  format: 'ktx2', // or 'basis'
  quality: 'high'
});`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Bonnes pratiques</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Limitez à 50k triangles par modèle</li>
            <li>Utilisez des textures 2048×2048 max</li>
            <li>Activez le LOD (Level of Detail)</li>
            <li>Compressez les textures en KTX2/Basis</li>
            <li>Utilisez des instancing pour objets répétitifs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const Optimization3DPageMemo = memo(Optimization3DPageContent);

export default function Optimization3DPage() {
  return (
    <ErrorBoundary componentName="Optimization3DPage">
      <Optimization3DPageMemo />
    </ErrorBoundary>
  );
}
