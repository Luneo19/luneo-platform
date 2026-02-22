'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CustomizerAdvancedPageContent() {
  const [copied, setCopied] = React.useState<string>('');
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const advancedExample = useMemo(() => `// Advanced Features
const customizer = new ProductCustomizer({
  plugins: ['filters', 'effects', 'clipart-browser'],
  filters: {
    blur: true,
    brightness: true,
    contrast: true
  },
  effects: {
    shadow: true,
    glow: true,
    outline: true
  },
  layers: {
    max: 50,
    blending: true
  },
  history: {
    undo: 50,
    redo: 50
  }
});`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Customizer Advanced</h1>
          <p className="text-xl text-gray-400">Fonctionnalités avancées</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Avancée</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{advancedExample}</pre>
            <button onClick={() => copyCode(advancedExample, 'adv')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'adv' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Plugins Disponibles</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <code>filters</code> - Filtres images</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <code>effects</code> - Effets texte</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <code>clipart-browser</code> - Navigateur cliparts</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <code>template-library</code> - Bibliothèque templates</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
