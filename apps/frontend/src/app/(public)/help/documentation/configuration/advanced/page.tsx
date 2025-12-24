'use client';

import React, { memo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AdvancedConfigPageContent() {
  return (
    <DocPageTemplate
      title="Paramètres Avancés"
      description="Configuration avancée de Luneo pour les cas d'usage complexes"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Configuration', href: '/help/documentation/configuration' },
        { label: 'Paramètres avancés', href: '/help/documentation/configuration/advanced' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Configuration Avancée</h2>
      <p className="text-gray-300 mb-6">
        Cette section couvre les paramètres avancés pour les cas d'usage enterprise complexes.
      </p>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Cache & Performance</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Configuration du cache Redis</li>
          <li>• Optimisation des requêtes</li>
          <li>• CDN et assets</li>
        </ul>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Scaling & Load Balancing</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Configuration multi-instance</li>
          <li>• Load balancing</li>
          <li>• Auto-scaling</li>
        </ul>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Custom Workers</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Configuration BullMQ personnalisée</li>
          <li>• Workers dédiés</li>
          <li>• Priorités de tâches</li>
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AdvancedConfigPageMemo = memo(AdvancedConfigPageContent);

export default function AdvancedConfigPage() {
  return (
    <ErrorBoundary componentName="AdvancedConfigPage">
      <AdvancedConfigPageMemo />
    </ErrorBoundary>
  );
}
