'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ARStudioGettingStartedPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const exampleCode = useMemo(() => `const ar = await luneo.ar.create({
  model: 'model.glb',
  scale: { x: 1, y: 1, z: 1 },
  enablePlacement: true
});

// Export for iOS
await ar.export('usdz');

// Export for Android
await ar.export('glb');`, []);

  return (
    <DocPageTemplate
      title="AR Studio - Getting Started"
      description="L'AR Studio permet de créer des expériences AR pour iOS (USDZ) et Android (GLB)"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AR Studio', href: '/help/documentation/ar-studio' },
        { label: 'Getting Started', href: '/help/documentation/ar-studio/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Virtual Try-On', href: '/help/documentation/virtual-try-on/getting-started', description: 'Try-On AR' },
        { title: '3D Models', href: '/help/documentation/3d/models', description: 'Modèles 3D' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Créer une expérience AR</h2>
        <div className="relative">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre className="overflow-x-auto">
              <code>{exampleCode}</code>
            </pre>
          </div>
          <button
            onClick={() => copyCode(exampleCode, 'ar')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'ar' ? (
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

const ARStudioGettingStartedPageMemo = memo(ARStudioGettingStartedPageContent);

export default function ARStudioGettingStartedPage() {
  return (
    <ErrorBoundary componentName="ARStudioGettingStartedPage">
      <ARStudioGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
