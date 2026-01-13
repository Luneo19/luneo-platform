'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DALLEIntegrationPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `const design = await client.ai.generateWithDALLE({
  prompt: 'Modern minimalist logo for tech startup',
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'hd',
  style: 'vivid'
});`, []);

  const parameters = useMemo(() => [
    { name: 'prompt', description: 'Description du design à générer', required: true },
    { name: 'model', description: 'Modèle DALL-E (dall-e-3 recommandé)', required: false },
    { name: 'size', description: 'Dimensions (1024x1024, 1792x1024, etc.)', required: false },
    { name: 'quality', description: 'Qualité (standard, hd)', required: false },
    { name: 'style', description: 'Style (vivid, natural)', required: false }
  ], []);

  return (
    <DocPageTemplate
      title="DALL-E Integration"
      description="Génération avec DALL-E 3 pour des images de haute qualité"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'DALL-E Integration', href: '/help/documentation/ai/dalle-integration' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ai/getting-started', description: 'Guide de démarrage' },
        { title: 'Models', href: '/help/documentation/ai/models', description: 'Modèles disponibles' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Exemple</h2>
          <button
            onClick={() => copyCode(example, 'dalle')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'dalle' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{example}</code>
          </pre>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Paramètres</h2>
        <div className="space-y-3">
          {parameters.map((param, index) => (
            <div key={index} className="bg-gray-900 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-blue-400 font-mono">{param.name}</code>
                {param.required && (
                  <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">requis</span>
                )}
              </div>
              <p className="text-sm text-gray-400">{param.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const DALLEIntegrationPageMemo = memo(DALLEIntegrationPageContent);

export default function DALLEIntegrationPage() {
  return (
    <ErrorBoundary componentName="DALLEIntegrationPage">
      <DALLEIntegrationPageMemo />
    </ErrorBoundary>
  );
}
