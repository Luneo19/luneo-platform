'use client';

import React, { memo, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function FigmaIntegrationPageContent() {
  const features = useMemo(() => [
    'Import de frames Figma',
    'Export vers Figma',
    'Synchronisation bidirectionnelle',
    'Préservation des styles et composants'
  ], []);

  const installationSteps = useMemo(() => [
    'Installez le plugin Luneo depuis la communauté Figma',
    'Connectez-vous avec votre compte Luneo',
    'Autorisez l\'accès à vos fichiers Figma',
    'Commencez à importer/exporter'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Figma"
      description="Import et export de designs entre Figma et Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Figma', href: '/help/documentation/integrations/figma' }
      ]}
      relatedLinks={[
        { title: 'GitHub', href: '/help/documentation/integrations/github', description: 'Versioning Git' },
        { title: 'Customizer', href: '/help/documentation/customizer/getting-started', description: 'Visual Customizer' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Intégration Figma</h2>
      <p className="text-gray-300 mb-6">
        Importez vos designs Figma dans Luneo ou exportez vos créations Luneo vers Figma.
      </p>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Fonctionnalités</h3>
        <ul className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Installation du plugin</h2>
      <ol className="space-y-4 text-gray-300">
        {installationSteps.map((step, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </DocPageTemplate>
  );
}

const FigmaIntegrationPageMemo = memo(FigmaIntegrationPageContent);

export default function FigmaIntegrationPage() {
  return (
    <ErrorBoundary componentName="FigmaIntegrationPage">
      <FigmaIntegrationPageMemo />
    </ErrorBoundary>
  );
}
