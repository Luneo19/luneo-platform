'use client';

import React, { memo, useMemo } from 'react';
import { Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CLICommandsPageContent() {
  const commands = useMemo(() => [
    { cmd: 'luneo init', desc: 'Initialise un nouveau projet' },
    { cmd: 'luneo dev', desc: 'Lance le serveur de développement' },
    { cmd: 'luneo build', desc: 'Build pour production' },
    { cmd: 'luneo deploy', desc: 'Déploie sur Vercel' },
    { cmd: 'luneo products list', desc: 'Liste les produits' },
    { cmd: 'luneo products create', desc: 'Crée un produit' },
    { cmd: 'luneo designs list', desc: 'Liste les designs' },
    { cmd: 'luneo designs export', desc: 'Exporte un design' },
    { cmd: 'luneo ai generate', desc: 'Génère avec IA' },
    { cmd: 'luneo webhooks list', desc: 'Liste les webhooks' },
  ], []);

  return (
    <DocPageTemplate
      title="CLI Commands"
      description="Liste complète des commandes disponibles dans la CLI Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'CLI', href: '/help/documentation/cli' },
        { label: 'Commandes', href: '/help/documentation/cli/commands' }
      ]}
      relatedLinks={[
        { title: 'Installation', href: '/help/documentation/cli/installation', description: 'Guide d\'installation' },
        { title: 'Workflows', href: '/help/documentation/cli/workflows', description: 'Automatisation CI/CD' }
      ]}
    >
      <div className="grid gap-4">
        {commands.map((command, index) => (
          <Card key={index} className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-start gap-4">
              <Terminal className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <code className="text-blue-400 text-lg font-mono">{command.cmd}</code>
                <p className="text-gray-300 mt-2">{command.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DocPageTemplate>
  );
}

const CLICommandsPageMemo = memo(CLICommandsPageContent);

export default function CLICommandsPage() {
  return (
    <ErrorBoundary componentName="CLICommandsPage">
      <CLICommandsPageMemo />
    </ErrorBoundary>
  );
}
