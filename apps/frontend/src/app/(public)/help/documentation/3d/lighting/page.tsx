'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThreeDLightingPageContent() {
  const [copied, setCopied] = React.useState('');
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const lightExample = useMemo(() => `// Lighting Configuration
const config = {
  lights: {
    ambient: {
      color: '#ffffff',
      intensity: 0.5
    },
    directional: {
      color: '#ffffff',
      intensity: 1.0,
      position: [5, 5, 5]
    },
    environment: '/hdri/studio.hdr'
  },
  shadows: true
};`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">3D Lighting</h1>
          <p className="text-xl text-gray-400">Éclairage réaliste avec IBL</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{lightExample}</pre>
            <button onClick={() => copyCode(lightExample, 'light')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'light' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Types d'Éclairage</h2>
          <div className="space-y-2 text-gray-300">
            <div>• <strong>Ambient:</strong> Éclairage général de la scène</div>
            <div>• <strong>Directional:</strong> Lumière directionnelle (soleil)</div>
            <div>• <strong>Point:</strong> Source ponctuelle (ampoule)</div>
            <div>• <strong>Spot:</strong> Projecteur directionnel</div>
            <div>• <strong>IBL (HDRI):</strong> Éclairage basé image</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const ThreeDLightingPageMemo = memo(ThreeDLightingPageContent);

export default function ThreeDLightingPage() {
  return (
    <ErrorBoundary componentName="ThreeDLightingPage">
      <ThreeDLightingPageMemo />
    </ErrorBoundary>
  );
}
