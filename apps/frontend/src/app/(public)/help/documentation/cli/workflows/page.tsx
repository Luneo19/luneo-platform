'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CLIWorkflowsPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const cicdExample = useMemo(() => `# .github/workflows/deploy.yml
name: Deploy Luneo
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g @luneo/cli
      - run: luneo login --token $\{\{ secrets.LUNEO_TOKEN \}\}
      - run: luneo build
      - run: luneo deploy --prod`, []);

  return (
    <DocPageTemplate
      title="CLI Workflows"
      description="Automatisez vos déploiements avec CI/CD et la CLI Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'CLI', href: '/help/documentation/cli' },
        { label: 'Workflows', href: '/help/documentation/cli/workflows' }
      ]}
      relatedLinks={[
        { title: 'Installation', href: '/help/documentation/cli/installation', description: 'Guide d\'installation' },
        { title: 'Commandes', href: '/help/documentation/cli/commands', description: 'Liste des commandes' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">GitHub Actions</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {cicdExample}
          </pre>
          <button
            onClick={() => copyCode(cicdExample, 'cicd')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'cicd' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Configuration requise</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Token LUNEO_TOKEN dans les secrets GitHub</li>
          <li>• Node.js 18+ installé</li>
          <li>• CLI Luneo installée globalement</li>
        </ul>
      </div>
    </DocPageTemplate>
  );
}

const CLIWorkflowsPageMemo = memo(CLIWorkflowsPageContent);

export default function CLIWorkflowsPage() {
  return (
    <ErrorBoundary componentName="CLIWorkflowsPage">
      <CLIWorkflowsPageMemo />
    </ErrorBoundary>
  );
}
