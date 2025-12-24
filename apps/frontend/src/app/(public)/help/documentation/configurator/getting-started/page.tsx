'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ConfiguratorGettingStartedPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => 'npm install @luneo/configurator', []);

  const usageCode = useMemo(() => `import { Configurator3D } from '@luneo/configurator';

<Configurator3D 
  model="product.glb"
  enableAR={true}
/>`, []);

  return (
    <DocPageTemplate
      title="3D Configurator - Getting Started"
      description="Le 3D Configurator permet la personnalisation de modèles 3D avec PBR materials"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Configurator', href: '/help/documentation/configurator' },
        { label: 'Getting Started', href: '/help/documentation/configurator/getting-started' }
      ]}
      relatedLinks={[
        { title: '3D Setup', href: '/help/documentation/3d/setup', description: 'Configuration 3D' },
        { title: '3D Models', href: '/help/documentation/3d/models', description: 'Gestion modèles' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <div className="relative">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{installCode}</pre>
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

      <section>
        <h2 className="text-2xl font-bold mb-4">Usage</h2>
        <div className="relative">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{usageCode}</pre>
          </div>
          <button
            onClick={() => copyCode(usageCode, 'usage')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'usage' ? (
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

const ConfiguratorGettingStartedPageMemo = memo(ConfiguratorGettingStartedPageContent);

export default function ConfiguratorGettingStartedPage() {
  return (
    <ErrorBoundary componentName="ConfiguratorGettingStartedPage">
      <ConfiguratorGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
