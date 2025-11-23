'use client';

import React from 'react';
import Link from 'next/link';
import { Palette, Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function APIDesignsPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const createExample = `// Create Design
const design = await fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'prod_xxx',
    name: 'Mon Design',
    canvas_data: {
      objects: [
        { type: 'text', content: 'Hello', x: 100, y: 100 }
      ]
    }
  })
});`;

  const listExample = `// List User Designs
const designs = await fetch('https://api.luneo.app/v1/designs?user_id=user_xxx', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
const { data } = await designs.json();`;

  const exportExample = `// Export Design
const exported = await fetch('https://api.luneo.app/v1/designs/design_xxx/export', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    format: 'png',
    dpi: 300,
    width: 4000
  })
});
const { url } = await exported.json();`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Designs API</h1>
          <p className="text-xl text-gray-400">Gérez les designs personnalisés</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple-400" />
            Endpoints
          </h2>
          <div className="space-y-3">
            {['GET /v1/designs', 'GET /v1/designs/:id', 'POST /v1/designs', 'PATCH /v1/designs/:id', 'DELETE /v1/designs/:id', 'POST /v1/designs/:id/export'].map((ep, i) => (
              <div key={i} className="p-3 bg-gray-900 rounded-lg font-mono text-sm text-gray-300">
                {ep}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Créer un Design</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {createExample}
            </pre>
            <button
              onClick={() => copyCode(createExample, 'create')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'create' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Lister les Designs</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {listExample}
            </pre>
            <button
              onClick={() => copyCode(listExample, 'list')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'list' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Exporter</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {exportExample}
            </pre>
            <button
              onClick={() => copyCode(exportExample, 'export')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'export' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
