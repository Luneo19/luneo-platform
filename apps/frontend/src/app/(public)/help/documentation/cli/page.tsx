'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CLIPageContent() {
  const installCommands = useMemo(() => [
    'npm install -g @luneo/cli',
    '# ou',
    'yarn global add @luneo/cli'
  ], []);

  const quickStart = useMemo(() => [
    { step: '1', command: 'luneo login', description: 'Connectez-vous à votre compte' },
    { step: '2', command: 'luneo init', description: 'Initialisez un nouveau projet' },
    { step: '3', command: 'luneo dev', description: 'Lancez le serveur de développement' }
  ], []);

  return (
    <DocPageTemplate
      title="Luneo CLI"
      description="Command-line interface pour automatisation et gestion de projets"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'CLI', href: '/help/documentation/cli' }
      ]}
      relatedLinks={[
        { title: 'Installation', href: '/help/documentation/cli/installation', description: 'Guide d\'installation' },
        { title: 'Commandes', href: '/help/documentation/cli/commands', description: 'Liste des commandes' },
        { title: 'Workflows', href: '/help/documentation/cli/workflows', description: 'Automatisation CI/CD' }
      ]}
    >
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Installation</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre className="overflow-x-auto">
            {installCommands.map((cmd, i) => (
              <React.Fragment key={i}>
                {cmd}
                {i < installCommands.length - 1 && '\n'}
              </React.Fragment>
            ))}
          </pre>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Démarrage rapide</h2>
        <div className="space-y-4">
          {quickStart.map((item) => (
            <div key={item.step} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <code className="text-blue-400 text-lg font-mono">{item.command}</code>
                  <p className="text-gray-300 mt-2">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Fonctionnalités principales</h2>
        <ul className="space-y-3 text-gray-300">
          <li>• Gestion de projets et produits</li>
          <li>• Génération de designs avec IA</li>
          <li>• Export et déploiement</li>
          <li>• Intégration CI/CD</li>
          <li>• Gestion des webhooks</li>
        </ul>
      </section>
    </DocPageTemplate>
  );
}

const CLIPageMemo = memo(CLIPageContent);

export default function CLIPage() {
  return (
    <ErrorBoundary componentName="CLIPage">
      <CLIPageMemo />
    </ErrorBoundary>
  );
}
