'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Camera, Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ARSetupPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const prerequisites = useMemo(() => [
    'Modèle 3D au format GLB optimisé pour AR',
    'Taille max: 5MB',
    'Compatible iOS (USDZ) et Android (GLB)'
  ], []);

  const arViewerCode = useMemo(() => `import { ARViewer } from '@luneo/react';

export default function ProductAR() {
  return (
    <ARViewer
      modelUrl="/models/product.glb"
      iosModelUrl="/models/product.usdz"
      placement="floor" // ou "wall"
      scale={1.0}
      autoRotate={false}
    />
  );
}`, []);

  const testSteps = useMemo(() => [
    'Ouvrez la page sur un smartphone',
    'Cliquez sur le bouton "Voir en AR"',
    'Autorisez l\'accès à la caméra',
    'Placez le produit dans votre espace'
  ], []);

  return (
    <DocPageTemplate
      title="Configuration AR/VR"
      description="Activez le Virtual Try-On avec AR pour vos produits"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AR', href: '/help/documentation/ar' },
        { label: 'Setup', href: '/help/documentation/ar/setup' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ar/getting-started', description: 'Guide AR' },
        { title: 'QR Codes', href: '/help/documentation/ar/qr-codes', description: 'QR Codes AR' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Prérequis</h2>
        <ul className="space-y-2 text-gray-300">
          {prerequisites.map((req, index) => (
            <li key={index}>• {req}</li>
          ))}
        </ul>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Activer l'AR sur un produit</h2>
          <button
            onClick={() => copyCode(arViewerCode, 'ar')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'ar' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{arViewerCode}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Camera className="w-6 h-6 text-indigo-400" />
          Aperçu AR Experience
        </h2>
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-lg p-6 border border-indigo-500/20">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <Camera className="w-20 h-20 text-indigo-400 animate-pulse" />
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-lg"></div>
          </div>
          <p className="text-gray-400 text-sm text-center mt-4">
            Expérience AR mobile - Visualisez vos produits dans votre espace
          </p>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Test AR</h2>
        <ol className="space-y-2 text-gray-300">
          {testSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </DocPageTemplate>
  );
}

const ARSetupPageMemo = memo(ARSetupPageContent);

export default function ARSetupPage() {
  return (
    <ErrorBoundary componentName="ARSetupPage">
      <ARSetupPageMemo />
    </ErrorBoundary>
  );
}
