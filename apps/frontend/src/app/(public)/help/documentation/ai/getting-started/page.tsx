'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIGettingStartedPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `// AI Generation
const design = await client.ai.generate({
  prompt: 'T-shirt avec logo lion moderne, couleurs vives',
  style: 'photorealistic',
  size: '1024x1024',
  product_id: 'prod_xxx'
});

logger.info('Generated:', design.image_url);`, []);

  return (
    <DocPageTemplate
      title="AI Generation - Getting Started"
      description="Générez des designs avec DALL-E 3 et l'IA Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Getting Started', href: '/help/documentation/ai/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Modèles', href: '/help/documentation/ai/models', description: 'Modèles disponibles' },
        { title: 'Prompts', href: '/help/documentation/ai/prompts', description: 'Guide des prompts' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Exemple de génération</h2>
          <button
            onClick={() => copyCode(example, 'example')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'example' ? (
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

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Paramètres disponibles</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• <code className="bg-gray-800 px-2 py-1 rounded">prompt</code> - Description du design</li>
          <li>• <code className="bg-gray-800 px-2 py-1 rounded">style</code> - Style de génération (photorealistic, artistic, etc.)</li>
          <li>• <code className="bg-gray-800 px-2 py-1 rounded">size</code> - Dimensions (1024x1024, 512x512, etc.)</li>
          <li>• <code className="bg-gray-800 px-2 py-1 rounded">product_id</code> - ID du produit cible</li>
        </ul>
      </div>
    </DocPageTemplate>
  );
}

const AIGettingStartedPageMemo = memo(AIGettingStartedPageContent);

export default function AIGettingStartedPage() {
  return (
    <ErrorBoundary componentName="AIGettingStartedPage">
      <AIGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
