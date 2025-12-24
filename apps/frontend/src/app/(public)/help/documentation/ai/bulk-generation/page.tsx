'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function BulkGenerationPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `// Bulk Generation (1000 designs)
const job = await client.ai.bulkGenerate({
  prompts: ['Design 1', 'Design 2', ...], // 1000 prompts
  style: 'photorealistic',
  parallelWorkers: 10
});

// Monitor progress
job.on('progress', (percent) => {
  logger.info(\`Progress: \${percent}%\`);
});

job.on('complete', (designs) => {
  logger.info(\`Generated \${designs.length} designs\`);
});`, []);

  return (
    <DocPageTemplate
      title="Bulk Generation"
      description="Générez des milliers de designs en masse avec l'IA"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Bulk Generation', href: '/help/documentation/ai/bulk-generation' }
      ]}
      relatedLinks={[
        { title: 'Generation', href: '/help/documentation/ai/generation', description: 'Génération simple' },
        { title: 'Best Practices', href: '/help/documentation/ai/best-practices', description: 'Bonnes pratiques' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Exemple de génération en masse</h2>
          <button
            onClick={() => copyCode(example, 'bulk')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'bulk' ? (
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
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Optimisations</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Utilisez <code className="bg-gray-800 px-2 py-1 rounded">parallelWorkers</code> pour accélérer</li>
          <li>• Surveillez la progression avec les événements</li>
          <li>• Groupez les prompts similaires pour meilleure performance</li>
        </ul>
      </div>
    </DocPageTemplate>
  );
}

const BulkGenerationPageMemo = memo(BulkGenerationPageContent);

export default function BulkGenerationPage() {
  return (
    <ErrorBoundary componentName="BulkGenerationPage">
      <BulkGenerationPageMemo />
    </ErrorBoundary>
  );
}
