'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Palette, Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIDesignsPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const endpoints = useMemo(() => [
    'GET /v1/designs',
    'GET /v1/designs/:id',
    'POST /v1/designs',
    'PATCH /v1/designs/:id',
    'DELETE /v1/designs/:id',
    'POST /v1/designs/:id/export'
  ], []);

  const createExample = useMemo(() => `// Create Design
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
});`, []);

  const listExample = useMemo(() => `// List User Designs
const designs = await fetch('https://api.luneo.app/v1/designs?user_id=user_xxx', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
const { data } = await designs.json();`, []);

  const exportExample = useMemo(() => `// Export Design
const exported = await fetch('https://api.luneo.app/v1/designs/design_xxx/export', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    format: 'png',
    dpi: 300,
    width: 4000
  })
});
const { url } = await exported.json();`, []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title: string }) => (
    <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button
          onClick={() => copyCode(code, id)}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
        >
          {copied === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <div className="relative">
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          {code}
        </pre>
      </div>
    </Card>
  );

  return (
    <DocPageTemplate
      title="Designs API"
      description="Gérez les designs personnalisés via l'API REST"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API', href: '/help/documentation/api' },
        { label: 'Designs', href: '/help/documentation/api/designs' }
      ]}
      relatedLinks={[
        { title: 'Products API', href: '/help/documentation/api/products', description: 'API Produits' },
        { title: 'Orders API', href: '/help/documentation/api/orders', description: 'API Commandes' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Palette className="w-6 h-6 text-purple-400" />
          Endpoints
        </h2>
        <div className="space-y-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="p-3 bg-gray-900 rounded-lg font-mono text-sm text-gray-300">
              {ep}
            </div>
          ))}
        </div>
      </Card>

      <CodeBlock code={createExample} id="create" title="Créer un Design" />
      <CodeBlock code={listExample} id="list" title="Lister les Designs" />
      <CodeBlock code={exportExample} id="export" title="Exporter" />
    </DocPageTemplate>
  );
}

const APIDesignsPageMemo = memo(APIDesignsPageContent);

export default function APIDesignsPage() {
  return (
    <ErrorBoundary componentName="APIDesignsPage">
      <APIDesignsPageMemo />
    </ErrorBoundary>
  );
}
