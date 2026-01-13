'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ArGettingStartedPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => 'npm install @luneo/ar-export', []);

  const exampleCode = useMemo(() => `import { ARExporter } from '@luneo/ar-export';

const exporter = new ARExporter({
  apiKey: 'YOUR_API_KEY'
});

// Export for iOS
const usdzUrl = await exporter.export({
  modelUrl: '/models/product.glb',
  format: 'usdz'
});

// Export for Android
const glbUrl = await exporter.export({
  modelUrl: '/models/product.glb',
  format: 'glb'
});`, []);

  return (
    <DocPageTemplate
      title="AR - Getting Started"
      description="Premier export AR en 10 minutes"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AR', href: '/help/documentation/ar' },
        { label: 'Getting Started', href: '/help/documentation/ar/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/ar/setup', description: 'Configuration AR' },
        { title: 'QR Codes', href: '/help/documentation/ar/qr-codes', description: 'QR Codes AR' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <div className="relative">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
              {installCode}
            </pre>
          </div>
          <button
            onClick={() => copyCode(installCode, 'install')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'install' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Exemple d'utilisation</h2>
        <div className="relative">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{exampleCode}</code>
            </pre>
          </div>
          <button
            onClick={() => copyCode(exampleCode, 'example')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'example' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const ArGettingStartedPageMemo = memo(ArGettingStartedPageContent);

export default function ArGettingStartedPage() {
  return (
    <ErrorBoundary componentName="ArGettingStartedPage">
      <ArGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
