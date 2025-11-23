'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DALLEIntegrationPage() {
  const [copied, setCopied] = React.useState('');
  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const example = `const design = await client.ai.generateWithDALLE({
  prompt: 'Modern minimalist logo for tech startup',
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'hd',
  style: 'vivid'
});`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">DALL-E Integration</h1>
          <p className="text-xl text-gray-400">Génération avec DALL-E 3</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Exemple</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{example}</pre>
            <button onClick={() => copyCode(example, 'ex')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'ex' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Paramètres</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b border-gray-700"><th className="pb-2 text-gray-400">Param</th><th className="pb-2 text-gray-400">Options</th></tr></thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800"><td className="py-2"><code>model</code></td><td>dall-e-3</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>size</code></td><td>1024x1024, 1024x1792</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>quality</code></td><td>standard, hd</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>style</code></td><td>vivid, natural</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

