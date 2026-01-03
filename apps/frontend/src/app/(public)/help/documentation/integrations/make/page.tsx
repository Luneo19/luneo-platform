'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function MakeIntegrationPageContent() {
  const connectionSteps = useMemo(() => [
    'Dans Make → Create a scenario',
    'Ajoutez le module Luneo',
    'Connection → Add → API Key',
    'Collez votre API Key Luneo'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Make (Integromat)"
      description="Créez des scénarios d'automatisation visuels avec Make et Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Make', href: '/help/documentation/integrations/make' }
      ]}
      relatedLinks={[
        { title: 'Zapier', href: '/help/documentation/integrations/zapier', description: 'Intégration Zapier' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Webhooks API' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Connection à Make</h2>
        <ol className="space-y-2 text-gray-300">
          {connectionSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Exemple de scénario</h2>
        <p className="text-gray-300 mb-3 text-sm">
          Nouveau design Luneo → Créer produit Shopify → Envoyer email notification
        </p>
        <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
          ✨ Workflows illimités possibles avec Make
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const MakeIntegrationPageMemo = memo(MakeIntegrationPageContent);

export default function MakeIntegrationPage() {
  return (
    <ErrorBoundary componentName="MakeIntegrationPage">
      <MakeIntegrationPageMemo />
    </ErrorBoundary>
  );
}
