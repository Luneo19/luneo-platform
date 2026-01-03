'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ThreeDModelsPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const formats = useMemo(() => [
    { name: 'GLB', status: 'Recommandé', color: 'text-green-400' },
    { name: 'GLTF', status: 'Supporté', color: 'text-blue-400' },
    { name: 'FBX', status: 'Convertible', color: 'text-purple-400' }
  ], []);

  const uploadCode = useMemo(() => `const formData = new FormData();
formData.append('model', file);
formData.append('name', 'Sneaker V1');
formData.append('category', 'footwear');

const response = await fetch('https://api.luneo.app/v1/3d/models', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});

const { modelId, previewUrl } = await response.json();`, []);

  const optimizationTips = useMemo(() => [
    { label: 'Polygones', value: 'Max 50,000 triangles pour performance web' },
    { label: 'Textures', value: 'Max 2048×2048px, format WebP ou JPEG' },
    { label: 'Matériaux', value: 'Nommez clairement (upper, sole, laces, etc.)' },
    { label: 'Taille fichier', value: 'Max 10MB pour chargement rapide' },
    { label: 'Pivots', value: 'Centre du modèle à l\'origine (0,0,0)' }
  ], []);

  return (
    <DocPageTemplate
      title="Gestion des modèles 3D"
      description="Importez, optimisez et gérez vos modèles 3D pour le configurateur"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: '3D', href: '/help/documentation/3d' },
        { label: 'Models', href: '/help/documentation/3d/models' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/3d/setup', description: 'Configuration 3D' },
        { title: 'Getting Started', href: '/help/documentation/3d/getting-started', description: 'Guide 3D' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Formats supportés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {formats.map((format, index) => (
            <div key={index} className="p-4 bg-gray-900 rounded text-center">
              <div className={`text-2xl font-bold ${format.color} mb-2`}>{format.name}</div>
              <p className="text-sm text-gray-400">{format.status}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Upload via API</h2>
          <button
            onClick={() => copyCode(uploadCode, 'upload')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'upload' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{uploadCode}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Optimisation des modèles</h2>
        <ul className="space-y-3 text-gray-300">
          {optimizationTips.map((tip, index) => (
            <li key={index}>
              • <strong>{tip.label}:</strong> {tip.value}
            </li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const ThreeDModelsPageMemo = memo(ThreeDModelsPageContent);

export default function ThreeDModelsPage() {
  return (
    <ErrorBoundary componentName="ThreeDModelsPage">
      <ThreeDModelsPageMemo />
    </ErrorBoundary>
  );
}
