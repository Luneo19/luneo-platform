'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CustomizerConfigurationPageContent() {
  const [copied, setCopied] = React.useState<string>('');
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const configExample = useMemo(() => `const config = {
  canvas: {
    width: 800,
    height: 1000,
    backgroundColor: '#ffffff'
  },
  tools: {
    text: true,
    images: true,
    cliparts: true,
    shapes: true
  },
  fonts: ['Arial', 'Helvetica', 'Times New Roman'],
  colors: ['#000000', '#ffffff', '#ff0000'],
  export: {
    formats: ['png', 'svg', 'pdf'],
    dpi: 300,
    quality: 'high'
  }
};`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Customizer Configuration</h1>
          <p className="text-xl text-gray-400">Options de configuration complètes</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Complète</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{configExample}</pre>
            <button onClick={() => copyCode(configExample, 'config')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'config' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Options Canvas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-700"><th className="pb-2 text-gray-400">Option</th><th className="pb-2 text-gray-400">Type</th><th className="pb-2 text-gray-400">Default</th></tr></thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800"><td className="py-2"><code>width</code></td><td>number</td><td>800</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>height</code></td><td>number</td><td>1000</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>backgroundColor</code></td><td>string</td><td>'#fff'</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
