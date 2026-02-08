'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function VirtualTryOnGettingStartedPageContent() {
  const [copied, setCopied] = React.useState<string>('');
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `import { VirtualTryOnComponent } from '@luneo/react';

function TryOnPage() {
  return (
    <VirtualTryOnComponent
      category="glasses"
      modelUrl="/models/sunglasses.glb"
      config={{
        tracking: {
          face: { landmarks: 468 },
          hand: { landmarks: 21 }
        },
        performance: { targetFPS: 60 }
      }}
      onCapture={(screenshot) => {
        logger.info('Screenshot:', screenshot);
      }}
    />
  );
}`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Virtual Try-On - Getting Started</h1>
          <p className="text-xl text-gray-400">Premier essayage AR en 10 minutes</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Exemple Complet</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{example}</pre>
            <button onClick={() => copyCode(example, 'ex')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'ex' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Catégories Supportées</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Glasses (Lunettes)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Watches (Montres)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Jewelry (Bijoux)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Hats (Chapeaux)</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const VirtualTryOnGettingStartedPageMemo = memo(VirtualTryOnGettingStartedPageContent);

export default function VirtualTryOnGettingStartedPage() {
  return (
    <ErrorBoundary componentName="VirtualTryOnGettingStartedPage">
      <VirtualTryOnGettingStartedPageMemo />
    </ErrorBoundary>
  );
}

