'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Package, CheckCircle, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIProductsPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const endpoints = useMemo(() => [
    { method: 'GET', path: '/v1/products', desc: 'Liste tous les produits' },
    { method: 'GET', path: '/v1/products/:id', desc: 'Récupère un produit' },
    { method: 'POST', path: '/v1/products', desc: 'Crée un produit' },
    { method: 'PATCH', path: '/v1/products/:id', desc: 'Met à jour un produit' },
    { method: 'DELETE', path: '/v1/products/:id', desc: 'Supprime un produit' },
  ], []);

  const createExample = useMemo(() => `// Create Product
const response = await fetch('https://api.luneo.app/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'T-Shirt Premium',
    category: 'apparel',
    price: 29.99,
    customizable: true,
    image_url: 'https://...',
    description: 'T-shirt 100% coton'
  })
});

const product = await response.json();
logger.info('Created:', product.id);`, []);

  const listExample = useMemo(() => `// List Products
const response = await fetch('https://api.luneo.app/v1/products?limit=20&offset=0', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const { data, total } = await response.json();
logger.info(\`Found \${total} products\`);`, []);

  const updateExample = useMemo(() => `// Update Product
await fetch('https://api.luneo.app/v1/products/prod_xxx', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    price: 24.99,
    stock: 150
  })
});`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Products API</h1>
          <p className="text-xl text-gray-400">Gérez vos produits via API REST</p>
        </div>

        {/* Endpoints */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            Endpoints Disponibles
          </h2>
          
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg">
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  ep.method === 'GET' ? 'bg-blue-500' :
                  ep.method === 'POST' ? 'bg-green-500' :
                  ep.method === 'PATCH' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {ep.method}
                </span>
                <code className="text-gray-300 font-mono text-sm flex-1">{ep.path}</code>
                <span className="text-gray-400 text-sm">{ep.desc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Create */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Créer un Produit</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {createExample}
            </pre>
            <button
              onClick={() => copyCode(createExample, 'create')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'create' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* List */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Lister les Produits</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {listExample}
            </pre>
            <button
              onClick={() => copyCode(listExample, 'list')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'list' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Update */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Mettre à Jour</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {updateExample}
            </pre>
            <button
              onClick={() => copyCode(updateExample, 'update')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'update' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Parameters */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Paramètres</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2 text-gray-400 font-semibold">Param</th>
                  <th className="pb-2 text-gray-400 font-semibold">Type</th>
                  <th className="pb-2 text-gray-400 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800"><td className="py-2"><code>name</code></td><td>string</td><td>Nom du produit</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>category</code></td><td>string</td><td>Catégorie</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>price</code></td><td>number</td><td>Prix en €</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>customizable</code></td><td>boolean</td><td>Personnalisable</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2"><code>image_url</code></td><td>string</td><td>URL image</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

const APIProductsPageMemo = memo(APIProductsPageContent);

export default function APIProductsPage() {
  return (
    <ErrorBoundary componentName="APIProductsPage">
      <APIProductsPageMemo />
    </ErrorBoundary>
  );
}
