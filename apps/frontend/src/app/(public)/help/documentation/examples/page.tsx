'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Code, Copy, CheckCircle } from 'lucide-react';
import { logger } from '../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ExamplesPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const createDesignExample = useMemo(() => `// JavaScript
const response = await fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'prod_xxx',
    name: 'Mon Design',
    canvas_data: { objects: [] }
  })
});

const design = await response.json();`, []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title: string }) => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">{title}</h2>
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
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
        <pre className="overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );

  return (
    <DocPageTemplate
      title="Code Examples"
      description="Exemples prêts à utiliser pour intégrer Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Examples', href: '/help/documentation/examples' }
      ]}
      relatedLinks={[
        { title: 'Quickstart', href: '/help/documentation/quickstart', description: 'Guide de démarrage' },
        { title: 'API Reference', href: '/help/documentation/api-reference', description: 'Référence API' }
      ]}
    >
      <CodeBlock code={createDesignExample} id="create" title="Create a Design" />
    </DocPageTemplate>
  );
}

const ExamplesPageMemo = memo(ExamplesPageContent);

export default function ExamplesPage() {
  return (
    <ErrorBoundary componentName="ExamplesPage">
      <ExamplesPageMemo />
    </ErrorBoundary>
  );
}
