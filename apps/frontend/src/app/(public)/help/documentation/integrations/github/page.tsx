'use client';

import React, { memo, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function GitHubIntegrationPageContent() {
  const features = useMemo(() => [
    'Versioning automatique des designs',
    'Pull requests pour review de designs',
    'CI/CD pour automatisation',
    'Synchronisation avec votre repository'
  ], []);

  const configSteps = useMemo(() => [
    'Connectez votre compte GitHub dans les paramètres',
    'Autorisez l\'accès à vos repositories',
    'Sélectionnez le repository cible',
    'Configurez les règles de synchronisation'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration GitHub"
      description="Intégration Git pour le versioning de vos designs"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'GitHub', href: '/help/documentation/integrations/github' }
      ]}
      relatedLinks={[
        { title: 'CLI', href: '/help/documentation/cli', description: 'CLI Luneo' },
        { title: 'Workflows', href: '/help/documentation/cli/workflows', description: 'CI/CD workflows' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Intégration GitHub</h2>
      <p className="text-gray-300 mb-6">
        Utilisez GitHub pour versionner vos designs et collaborer avec votre équipe.
      </p>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Fonctionnalités</h3>
        <ul className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Configuration</h2>
      <ol className="space-y-4 text-gray-300">
        {configSteps.map((step, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </DocPageTemplate>
  );
}

const GitHubIntegrationPageMemo = memo(GitHubIntegrationPageContent);

export default function GitHubIntegrationPage() {
  return (
    <ErrorBoundary componentName="GitHubIntegrationPage">
      <GitHubIntegrationPageMemo />
    </ErrorBoundary>
  );
}
