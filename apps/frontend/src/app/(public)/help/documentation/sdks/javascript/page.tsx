'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function JavaScriptSDKPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installExample = useMemo(() => `npm install @luneo/sdk
# or
pnpm add @luneo/sdk
# or
yarn add @luneo/sdk`, []);

  const initExample = `import { LuneoClient } from '@luneo/sdk';

const client = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY,
  projectId: 'proj_xxx'
});`;

  const productsExample = `// Products
const products = await client.products.list({ limit: 20 });
const product = await client.products.get('prod_xxx');
const newProduct = await client.products.create({
  name: 'T-Shirt',
  price: 29.99
});`;

  const designsExample = `// Designs
const design = await client.designs.create({
  product_id: 'prod_xxx',
  canvas_data: { objects: [...] }
});

const exported = await client.designs.export('design_xxx', {
  format: 'png',
  dpi: 300
});`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">JavaScript SDK</h1>
          <p className="text-xl text-gray-400">SDK officiel pour JavaScript/TypeScript</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {installExample}
            </pre>
            <button onClick={() => copyCode(installExample, 'install')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'install' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Initialisation</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {initExample}
            </pre>
            <button onClick={() => copyCode(initExample, 'init')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'init' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Products</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {productsExample}
            </pre>
            <button onClick={() => copyCode(productsExample, 'products')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'products' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Designs</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {designsExample}
            </pre>
            <button onClick={() => copyCode(designsExample, 'designs')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'designs' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
