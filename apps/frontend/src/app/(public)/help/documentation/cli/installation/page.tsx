'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CLIInstallationPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const globalInstall = useMemo(() => 'npm install -g @luneo/cli', []);
  const localInstall = useMemo(() => 'npm install @luneo/cli', []);
  const verifyInstall = useMemo(() => 'luneo --version', []);

  return (
    <DocPageTemplate
      title="CLI Installation"
      description="Installez la CLI Luneo pour automatiser vos workflows"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'CLI', href: '/help/documentation/cli' },
        { label: 'Installation', href: '/help/documentation/cli/installation' }
      ]}
      relatedLinks={[
        { title: 'Commandes', href: '/help/documentation/cli/commands', description: 'Liste des commandes' },
        { title: 'Workflows', href: '/help/documentation/cli/workflows', description: 'Automatisation CI/CD' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Installation Globale</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {globalInstall}
          </pre>
          <button
            onClick={() => copyCode(globalInstall, 'install')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'install' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Installation Locale</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {localInstall}
          </pre>
          <button
            onClick={() => copyCode(localInstall, 'local')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'local' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Vérifier l'installation</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {verifyInstall}
          </pre>
          <button
            onClick={() => copyCode(verifyInstall, 'verify')}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'verify' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const CLIInstallationPageMemo = memo(CLIInstallationPageContent);

export default function CLIInstallationPage() {
  return (
    <ErrorBoundary componentName="CLIInstallationPage">
      <CLIInstallationPageMemo />
    </ErrorBoundary>
  );
}
